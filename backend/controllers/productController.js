const { Product, Category } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

exports.getAllProducts = async (req, res, next) => {
    try {
        const { search, category, page = 1, limit = 20 } = req.query;
        let where = {};
        
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }
        if (category) {
            where.categoryId = category;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await Product.findAndCountAll({
            where,
            include: [{ model: Category, as: 'category', attributes: ['name'] }],
            order: [['name', 'ASC']],
            limit: parseInt(limit),
            offset
        });

        // formatting data to match older response if needed (c.name as category_name)
        const products = rows.map(p => {
            const data = p.toJSON();
            data.category_name = data.category ? data.category.name : null;
            return data;
        });

        res.json({
            status: 'success',
            data: products,
            meta: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category' }]
        });
        if (!product) return next(new AppError('Ürün bulunamadı', 404));
        res.json({ status: 'success', data: product });
    } catch (error) {
        next(error);
    }
};

exports.createProduct = async (req, res, next) => {
    try {
        const { name, price, stock, category_id, description, barcode } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        await Product.create({
            name,
            price,
            stock,
            categoryId: category_id,
            description,
            sku: barcode,
            imageUrl
        });
        
        res.status(201).json({ status: 'success', message: 'Ürün eklendi' });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { name, price, stock, category_id, description, barcode } = req.body;
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) return next(new AppError('Ürün bulunamadı', 404));

        let updateData = {
            name, price, stock, categoryId: category_id, description, sku: barcode
        };

        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        await product.update(updateData);
        res.json({ status: 'success', message: 'Ürün güncellendi' });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) return next(new AppError('Ürün bulunamadı', 404));

        // Hard delete since is_active is removed
        await product.destroy();
        res.json({ status: 'success', message: 'Ürün silindi' });
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        const products = await Product.findAll({
            where: { stock: { [Op.lt]: 10 } },
            order: [['stock', 'ASC']]
        });
        res.json({ status: 'success', data: products });
    } catch (error) {
        next(error);
    }
};
