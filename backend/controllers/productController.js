const { Product, Category } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { buildImageUrls, deleteCloudinaryAsset } = require('./mediaController');

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

        let imageData = {};
        if (req.file) {
            const publicId = req.file.filename;
            const urls = buildImageUrls(publicId);
            imageData = {
                imageUrl: urls.large,
                thumbnailUrl: urls.thumbnail,
                mediumUrl: urls.medium,
                placeholderUrl: urls.placeholder,
                cloudinaryId: publicId
            };
        }

        const product = await Product.create({
            name,
            price,
            stock,
            categoryId: category_id,
            description,
            sku: barcode,
            ...imageData
        });
        
        res.status(201).json({ status: 'success', message: 'Ürün eklendi', data: product });
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
            // Delete old Cloudinary image if exists
            if (product.cloudinaryId) {
                await deleteCloudinaryAsset(product.cloudinaryId);
            }
            const publicId = req.file.filename;
            const urls = buildImageUrls(publicId);
            updateData.imageUrl = urls.large;
            updateData.thumbnailUrl = urls.thumbnail;
            updateData.mediumUrl = urls.medium;
            updateData.placeholderUrl = urls.placeholder;
            updateData.cloudinaryId = publicId;
        }

        await product.update(updateData);
        res.json({ status: 'success', message: 'Ürün güncellendi', data: product });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) return next(new AppError('Ürün bulunamadı', 404));

        // Cascade delete: remove Cloudinary image if exists
        if (product.cloudinaryId) {
            await deleteCloudinaryAsset(product.cloudinaryId);
        }

        await product.destroy();
        res.json({ status: 'success', message: 'Ürün ve görseli silindi' });
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
