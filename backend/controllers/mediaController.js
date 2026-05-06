const cloudinary = require('../config/cloudinary');
const { AppError } = require('../middleware/errorHandler');
const { Product } = require('../models');
const logger = require('../utils/logger');

// ── URL Builder Helpers ───────────────────────────────────────────────────

/**
 * Build optimised CDN URLs for a given Cloudinary publicId.
 * Returns { original, thumbnail, medium, large, placeholder }
 */
const buildImageUrls = (publicId) => {
    if (!publicId) return null;

    const base = { quality: 'auto', fetch_format: 'auto' };

    return {
        original: cloudinary.url(publicId, { ...base, secure: true }),
        thumbnail: cloudinary.url(publicId, { ...base, width: 100, height: 100, crop: 'fill', secure: true }),
        medium: cloudinary.url(publicId, { ...base, width: 300, height: 300, crop: 'fill', secure: true }),
        large: cloudinary.url(publicId, { ...base, width: 800, height: 800, crop: 'limit', secure: true }),
        // Low-quality placeholder for lazy loading
        placeholder: cloudinary.url(publicId, { quality: 10, width: 20, fetch_format: 'auto', secure: true })
    };
};

// ── POST /api/media/upload ────────────────────────────────────────────────
exports.uploadSingle = async (req, res, next) => {
    try {
        if (!req.file) return next(new AppError('Dosya bulunamadı', 400));

        const { path: cloudinaryUrl, filename: publicId } = req.file;
        const urls = buildImageUrls(publicId);

        res.status(201).json({
            status: 'success',
            data: {
                publicId,
                urls,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/media/upload-multiple ──────────────────────────────────────
exports.uploadMultiple = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next(new AppError('Dosya bulunamadı', 400));
        }

        const results = req.files.map(file => ({
            publicId: file.filename,
            urls: buildImageUrls(file.filename),
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        }));

        res.status(201).json({
            status: 'success',
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

// ── DELETE /api/media/:publicId ───────────────────────────────────────────
exports.deleteMedia = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        if (!publicId) return next(new AppError('publicId zorunludur', 400));

        // Decode URL-encoded publicId (e.g., "veor/products/abc123")
        const decodedId = decodeURIComponent(publicId);

        const result = await cloudinary.uploader.destroy(decodedId, { type: 'authenticated' });

        if (result.result === 'not found') {
            return next(new AppError('Medya bulunamadı', 404));
        }

        logger.info(`Media deleted: ${decodedId} by user ${req.user?.id}`);

        res.json({ status: 'success', message: 'Medya silindi', result });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/media/:publicId ──────────────────────────────────────────────
exports.getMediaInfo = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        const decodedId = decodeURIComponent(publicId);

        const resource = await cloudinary.api.resource(decodedId, { type: 'authenticated' });

        res.json({
            status: 'success',
            data: {
                publicId: resource.public_id,
                format: resource.format,
                width: resource.width,
                height: resource.height,
                bytes: resource.bytes,
                createdAt: resource.created_at,
                urls: buildImageUrls(decodedId)
            }
        });
    } catch (error) {
        if (error.http_code === 404) {
            return next(new AppError('Medya bulunamadı', 404));
        }
        next(error);
    }
};

// ── Helper: Delete Cloudinary asset (used by product/cascade delete) ──────
exports.deleteCloudinaryAsset = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { type: 'authenticated' });
        logger.info(`Cloudinary asset deleted: ${publicId}`);
    } catch (err) {
        logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
    }
};

// ── Helper: Build URLs (exported for use in other controllers) ────────────
exports.buildImageUrls = buildImageUrls;
