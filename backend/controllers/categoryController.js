const { dbGet, dbRun, dbAll } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await dbAll('SELECT * FROM categories ORDER BY name ASC');
        res.json({ status: 'success', data: categories });
    } catch (error) {
        next(error);
    }
};

exports.createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const exists = await dbGet('SELECT id FROM categories WHERE name = ?', [name]);
        if (exists) return next(new AppError('Bu isimde bir kategori zaten var', 400));

        await dbRun('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
        res.status(201).json({ status: 'success', message: 'Kategori oluşturuldu' });
    } catch (error) {
        next(error);
    }
};

exports.updateCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const { id } = req.params;
        
        const exists = await dbGet('SELECT id FROM categories WHERE id = ?', [id]);
        if (!exists) return next(new AppError('Kategori bulunamadı', 404));

        await dbRun('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        res.json({ status: 'success', message: 'Kategori güncellendi' });
    } catch (error) {
        next(error);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exists = await dbGet('SELECT id FROM categories WHERE id = ?', [id]);
        if (!exists) return next(new AppError('Kategori bulunamadı', 404));

        // Check products using this category
        const prod = await dbGet('SELECT id FROM products WHERE category_id = ?', [id]);
        if (prod) return next(new AppError('Bu kategoriye ait ürünler var, önce onları silin', 400));

        await dbRun('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ status: 'success', message: 'Kategori silindi' });
    } catch (error) {
        next(error);
    }
};
