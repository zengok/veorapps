const { Sale, Product, User, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const exceljs = require('exceljs');

exports.createSale = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { product_id, quantity, discount = 0, notes } = req.body;
        const user_id = req.user.id;

        const product = await Product.findByPk(product_id, { transaction: t });
        if (!product) throw new AppError('Ürün bulunamadı', 404);

        if (product.stock < quantity) {
            throw new AppError('Kritik Hata: Stok yetersiz veya tükenmiş!', 400);
        }

        const unit_price = product.price;
        const total_price = (unit_price * quantity) - discount;

        // Create sale record
        await Sale.create({
            productId: product_id,
            userId: user_id,
            quantity,
            totalPrice: total_price,
            status: 'completed'
            // notes and discount were removed in new schema, omitting
        }, { transaction: t });

        // Update stock
        await product.update({ stock: product.stock - quantity }, { transaction: t });

        await t.commit();
        res.status(201).json({ status: 'success', message: 'Satış kaydedildi' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.getAllSales = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Sale.findAndCountAll({
            include: [{ model: User, as: 'user', attributes: ['username'] }],
            order: [['date', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            status: 'success',
            data: rows,
            meta: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) {
        next(error);
    }
};

exports.getSaleDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findByPk(id, {
            include: [
                { model: User, as: 'user', attributes: ['username'] },
                { model: Product, as: 'product', attributes: ['name', 'price'] }
            ]
        });
        
        if (!sale) return next(new AppError('Satış bulunamadı', 404));

        res.json({ status: 'success', data: sale });
    } catch (error) {
        next(error);
    }
};

exports.cancelSale = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        const sale = await Sale.findByPk(id, { transaction: t });
        if (!sale) throw new AppError('Satış bulunamadı', 404);
        if (sale.status === 'cancelled') throw new AppError('Satış zaten iptal edilmiş', 400);

        // Revert stock
        const product = await Product.findByPk(sale.productId, { transaction: t });
        if (product) {
            await product.update({ stock: product.stock + sale.quantity }, { transaction: t });
        }

        // Update status
        await sale.update({ status: 'cancelled' }, { transaction: t });

        await t.commit();
        res.json({ status: 'success', message: 'Satış iptal edildi ve stok iade edildi' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.exportExcel = async (req, res, next) => {
    try {
        const sales = await Sale.findAll({
            include: [
                { model: User, as: 'user', attributes: ['username'] },
                { model: Product, as: 'product', attributes: ['name'] }
            ],
            order: [['date', 'DESC']]
        });

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Satislar');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Tarih', key: 'date', width: 25 },
            { header: 'Satıcı', key: 'username', width: 20 },
            { header: 'Ürün', key: 'product_name', width: 30 },
            { header: 'Adet', key: 'quantity', width: 10 },
            { header: 'Tutar', key: 'totalPrice', width: 15 },
            { header: 'Durum', key: 'status', width: 15 }
        ];

        const rows = sales.map(s => ({
            id: s.id,
            date: s.date,
            username: s.user ? s.user.username : '',
            product_name: s.product ? s.product.name : '',
            quantity: s.quantity,
            totalPrice: s.totalPrice,
            status: s.status
        }));

        worksheet.addRows(rows);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=satis_raporu.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};
