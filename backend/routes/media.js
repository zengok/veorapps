const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');
const { uploadSingle: multerSingle, uploadProduct, handleMulterError } = require('../middleware/upload');
const mediaController = require('../controllers/mediaController');

// All media routes require authentication
router.use(authMiddleware);

// POST /api/media/upload — single file (generic)
router.post(
    '/upload',
    multerSingle.single('file'),
    handleMulterError,
    mediaController.uploadSingle
);

// POST /api/media/upload-multiple — up to 10 files
router.post(
    '/upload-multiple',
    uploadProduct.array('files', 10),
    handleMulterError,
    mediaController.uploadMultiple
);

// DELETE /api/media/:publicId — delete from Cloudinary (admin only)
router.delete(
    '/:publicId',
    roleMiddleware(['admin']),
    mediaController.deleteMedia
);

// GET /api/media/:publicId — get metadata
router.get('/:publicId', mediaController.getMediaInfo);

module.exports = router;
