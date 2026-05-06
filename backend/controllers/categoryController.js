const { Category, Product } = require('../models');
const { AppError } = require('../middleware/errorHandler');

exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.findAll({ order: [['name', 'ASC']] });
        res.json({ status: 'success', data: categories });
    } catch (error) {
        next(error);
    }
};

exports.createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const exists = await Category.findOne({ where: { name } });
        if (exists) return next(new AppError('Bu isimde bir kategori zaten var', 400));

        await Category.create({ name, description });
        res.status(201).json({ status: 'success', message: 'Kategori oluşturuldu' });
    } catch (error) {
        next(error);
    }
};

exports.updateCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const { id } = req.params;
        
        const category = await Category.findByPk(id);
        if (!category) return next(new AppError('Kategori bulunamadı', 404));

        await category.update({ name, description });
        res.json({ status: 'success', message: 'Kategori güncellendi' });
    } catch (error) {
        next(error);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) return next(new AppError('Kategori bulunamadı', 404));

        // Check products using this category
        const prod = await Product.findOne({ where: { categoryId: id } });
        if (prod) return next(new AppError('Bu kategoriye ait ürünler var, önce onları silin', 400));

        await category.destroy();
        res.json({ status: 'success', message: 'Kategori silindi' });
    } catch (error) {
        next(error);
    }
};
