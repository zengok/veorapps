const { dbGet, dbRun, dbAll, dbTransaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const exceljs = require('exceljs');

exports.createSale = async (req, res, next) => {
    try {
        const { product_id, quantity, discount = 0, notes } = req.body;
        const user_id = req.user.id;

        await dbTransaction(async () => {
            const product = await dbGet('SELECT * FROM products WHERE id = ?', [product_id]);
            if (!product) throw new AppError('Ürün bulunamadı', 404);

            const unit_price = product.price;
            const total_price = (unit_price * quantity) - discount;

            // Create sale record
            const saleResult = await dbRun(
                `INSERT INTO sales (total_amount, discount, notes, user_id) VALUES (?, ?, ?, ?)`,
                [total_price, discount, notes, user_id]
            );

            // Create sale_item record
            await dbRun(
                `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)`,
                [saleResult.lastID, product_id, quantity, unit_price, total_price]
            );

            // Update stock atomically and prevent race condition
            const updateResult = await dbRun(
                'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', 
                [quantity, product_id, quantity]
            );
            
            if (updateResult.changes === 0) {
                throw new AppError('Kritik Hata: Stok yetersiz veya tükenmiş!', 400);
            }

            // Log activity
            await dbRun('INSERT INTO activity_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
                [user_id, 'CREATE_SALE', 'sale', saleResult.lastID, `Sold ${quantity}x ${product.name}`]);
        });

        res.status(201).json({ status: 'success', message: 'Satış kaydedildi' });
    } catch (error) {
        next(error);
    }
};

exports.getAllSales = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT s.*, u.username 
            FROM sales s 
            JOIN users u ON s.user_id = u.id 
            ORDER BY s.sale_date DESC 
            LIMIT ? OFFSET ?
        `;
        const sales = await dbAll(query, [limit, offset]);
        const { total } = await dbGet('SELECT count(*) as total FROM sales');

        res.json({
            status: 'success',
            data: sales,
            meta: { total, page: parseInt(page), totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

exports.getSaleDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sale = await dbGet('SELECT * FROM sales WHERE id = ?', [id]);
        if (!sale) return next(new AppError('Satış bulunamadı', 404));

        const items = await dbAll(`
            SELECT si.*, p.name 
            FROM sale_items si 
            JOIN products p ON si.product_id = p.id 
            WHERE si.sale_id = ?
        `, [id]);

        res.json({ status: 'success', data: { ...sale, items } });
    } catch (error) {
        next(error);
    }
};

exports.cancelSale = async (req, res, next) => {
    try {
        const { id } = req.params;

        await dbTransaction(async () => {
            const sale = await dbGet('SELECT * FROM sales WHERE id = ?', [id]);
            if (!sale) throw new AppError('Satış bulunamadı', 404);
            if (sale.status === 'cancelled') throw new AppError('Satış zaten iptal edilmiş', 400);

            const items = await dbAll('SELECT * FROM sale_items WHERE sale_id = ?', [id]);

            // Revert stock
            for (const item of items) {
                await dbRun('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
            }

            // Update status
            await dbRun("UPDATE sales SET status = 'cancelled' WHERE id = ?", [id]);

            // Log
            await dbRun('INSERT INTO activity_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, 'CANCEL_SALE', 'sale', id, `Cancelled sale`]);
        });

        res.json({ status: 'success', message: 'Satış iptal edildi ve stok iade edildi' });
    } catch (error) {
        next(error);
    }
};

exports.exportExcel = async (req, res, next) => {
    try {
        const sales = await dbAll(`
            SELECT s.id, s.total_amount, s.sale_date, s.status, u.username, p.name as product_name, si.quantity
            FROM sales s
            JOIN users u ON s.user_id = u.id
            JOIN sale_items si ON s.id = si.sale_id
            JOIN products p ON si.product_id = p.id
            ORDER BY s.sale_date DESC
        `);

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Satislar');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Tarih', key: 'sale_date', width: 25 },
            { header: 'Satıcı', key: 'username', width: 20 },
            { header: 'Ürün', key: 'product_name', width: 30 },
            { header: 'Adet', key: 'quantity', width: 10 },
            { header: 'Tutar', key: 'total_amount', width: 15 },
            { header: 'Durum', key: 'status', width: 15 }
        ];

        worksheet.addRows(sales);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=satis_raporu.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};
