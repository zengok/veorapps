const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { AppError } = require('./errorHandler');

// ── Allowed MIME types ────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── MIME-type filter ─────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(`Desteklenmeyen dosya tipi: ${file.mimetype}. İzin verilenler: JPEG, PNG, WebP, AVIF, GIF`, 400), false);
    }
};

// ── Cloudinary storage factory ────────────────────────────────────────────
const makeStorage = (folder, transformations = []) =>
    new CloudinaryStorage({
        cloudinary,
        params: async (req, file) => ({
            folder: `veor/${folder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'],
            // Auto convert to WebP & optimise quality
            transformation: [
                { quality: 'auto', fetch_format: 'auto' },
                ...transformations
            ],
            // Signed upload for tamper-proof security
            type: 'authenticated',
            // Unique public_id per upload
            public_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
        })
    });

// ── Product uploader (with thumbnail variants generated via Cloudinary) ──
const productStorage = makeStorage('products', [{ width: 800, height: 800, crop: 'limit' }]);

// ── User avatar uploader ──────────────────────────────────────────────────
const avatarStorage = makeStorage('users', [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }]);

// ── Category image uploader ───────────────────────────────────────────────
const categoryStorage = makeStorage('categories', [{ width: 600, height: 400, crop: 'fill' }]);

// ── Multer instances ──────────────────────────────────────────────────────
const uploadProduct = multer({
    storage: productStorage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

const uploadCategory = multer({
    storage: categoryStorage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

// Generic single upload (uses products folder by default)
const uploadSingle = multer({
    storage: makeStorage('general'),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

// ── Multer error wrapper ──────────────────────────────────────────────────
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ status: 'error', message: `Dosya boyutu 10MB\'ı aşamaz.` });
        }
        return res.status(400).json({ status: 'error', message: err.message });
    }
    next(err);
};

module.exports = {
    uploadProduct,
    uploadAvatar,
    uploadCategory,
    uploadSingle,
    handleMulterError
};
