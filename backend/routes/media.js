const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');
const { uploadSingle: multerSingle, uploadProduct, handleMulterError } = require('../middleware/upload');
const mediaController = require('../controllers/mediaController');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Cloudinary medya yönetimi
 */

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Tek dosya yükle
 *     tags: [Media]
 *     description: |
 *       Cloudinary'ye resim yükler. Otomatik olarak WebP/AVIF dönüşümü yapılır ve
 *       çoklu çözünürlükte URL'ler üretilir.
 *       **Desteklenen formatlar:** JPEG, PNG, WebP, AVIF, GIF
 *       **Max boyut:** 10 MB
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Dosya yüklendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/MediaUploadResult'
 *       400:
 *         description: Geçersiz dosya tipi veya boyut aşımı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    '/upload',
    multerSingle.single('file'),
    handleMulterError,
    mediaController.uploadSingle
);

/**
 * @swagger
 * /api/media/upload-multiple:
 *   post:
 *     summary: Çoklu dosya yükle (max 10)
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Dosyalar yüklendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MediaUploadResult'
 *       400:
 *         description: Dosya bulunamadı veya geçersiz format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    '/upload-multiple',
    uploadProduct.array('files', 10),
    handleMulterError,
    mediaController.uploadMultiple
);

/**
 * @swagger
 * /api/media/{publicId}:
 *   delete:
 *     summary: Medyayı Cloudinary'den sil
 *     tags: [Media]
 *     description: Yalnızca admin. publicId URL-encoded olarak gönderilebilir.
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public_id (örn. `veor%2Fproducts%2Fabc123`)
 *     responses:
 *       200:
 *         description: Medya silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Medya silindi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
    '/:publicId',
    roleMiddleware(['admin']),
    mediaController.deleteMedia
);

/**
 * @swagger
 * /api/media/{publicId}:
 *   get:
 *     summary: Medya metadata bilgisi
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public_id
 *     responses:
 *       200:
 *         description: Medya bilgisi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                     format:
 *                       type: string
 *                       example: jpg
 *                     width:
 *                       type: integer
 *                     height:
 *                       type: integer
 *                     bytes:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     urls:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:publicId', mediaController.getMediaInfo);

module.exports = router;
