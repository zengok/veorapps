const { dbGet, dbRun, dbAll } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

exports.getAllProducts = async (req, res, next) => {
    try {
        const { search, category, page = 1, limit = 20 } = req.query;
        let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1';
        let params = [];

        if (search) {
            query += ' AND p.name LIKE ?';
            params.push(`%${search}%`);
        }
        if (category) {
            query += ' AND p.category_id = ?';
            params.push(category);
        }

        // Pagination
        const offset = (page - 1) * limit;
        query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const products = await dbAll(query, params);
        
        // Count total
        let countQuery = 'SELECT count(*) as total FROM products p WHERE p.is_active = 1';
        let countParams = [];
        if (search) { countQuery += ' AND p.name LIKE ?'; countParams.push(`%${search}%`); }
        if (category) { countQuery += ' AND p.category_id = ?'; countParams.push(category); }
        
        const { total } = await dbGet(countQuery, countParams);

        res.json({
            status: 'success',
            data: products,
            meta: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    try {
        const product = await dbGet('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
        if (!product) return next(new AppError('Ürün bulunamadı', 404));
        res.json({ status: 'success', data: product });
    } catch (error) {
        next(error);
    }
};

exports.createProduct = async (req, res, next) => {
    try {
        const { name, price, stock, category_id, description, barcode } = req.body;
        // Image logic from multer would go here, skipping for now
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        await dbRun(`INSERT INTO products (name, price, stock, category_id, description, barcode, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [name, price, stock, category_id, description, barcode, image_url]);
        
        res.status(201).json({ status: 'success', message: 'Ürün eklendi' });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { name, price, stock, category_id, description, barcode } = req.body;
        const { id } = req.params;

        const exists = await dbGet('SELECT id FROM products WHERE id = ?', [id]);
        if (!exists) return next(new AppError('Ürün bulunamadı', 404));

        let query = `UPDATE products SET name=?, price=?, stock=?, category_id=?, description=?, barcode=?, updated_at=CURRENT_TIMESTAMP`;
        let params = [name, price, stock, category_id, description, barcode];

        if (req.file) {
            query += `, image_url=?`;
            params.push(`/uploads/${req.file.filename}`);
        }
        
        query += ` WHERE id=?`;
        params.push(id);

        await dbRun(query, params);
        res.json({ status: 'success', message: 'Ürün güncellendi' });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exists = await dbGet('SELECT id FROM products WHERE id = ?', [id]);
        if (!exists) return next(new AppError('Ürün bulunamadı', 404));

        // Soft delete
        await dbRun('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
        res.json({ status: 'success', message: 'Ürün silindi (soft delete)' });
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const products = await dbAll('SELECT * FROM products WHERE stock < 10 AND is_active = 1 ORDER BY stock ASC');
        res.json({ status: 'success', data: products });
    } catch (error) {
        next(error);
    }
};
