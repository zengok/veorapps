const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/') },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Ürün yönetimi
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Tüm ürünleri listele
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Ürün adına göre arama
 *         example: Veor
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Kategori ID'sine göre filtrele
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Ürün listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Düşük stoklu ürünler (stok < 10)
 *     tags: [Products]
 *     description: Yalnızca admin erişebilir.
 *     responses:
 *       200:
 *         description: Düşük stoklu ürün listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/low-stock', roleMiddleware('admin'), productController.getLowStock);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Ürün detayı
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Ürün bilgisi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', productController.getProduct);

const validateProduct = [
    body('name').trim().notEmpty().withMessage('Ürün adı gerekli'),
    body('price').isFloat({ min: 0 }).withMessage('Geçerli bir fiyat girin'),
    body('stock').isInt({ min: 0 }).withMessage('Geçerli bir stok girin')
];

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Yeni ürün ekle
 *     tags: [Products]
 *     description: Yalnızca admin erişebilir. Resim yüklemek için `multipart/form-data` kullanın.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, stock]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Veor Night 100ml
 *               price:
 *                 type: number
 *                 example: 750.00
 *               stock:
 *                 type: integer
 *                 example: 50
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               description:
 *                 type: string
 *               barcode:
 *                 type: string
 *                 example: VEO-NT-001
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ürün görseli (JPEG, PNG, WebP - max 10MB)
 *     responses:
 *       201:
 *         description: Ürün oluşturuldu
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
 *                   example: Ürün eklendi
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', roleMiddleware('admin'), upload.single('image'), validateProduct, validate, productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Ürün güncelle
 *     tags: [Products]
 *     description: Yalnızca admin. Resim yüklenirse eski Cloudinary görseli otomatik silinir.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               barcode:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Ürün güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', roleMiddleware('admin'), upload.single('image'), validateProduct, validate, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Ürün sil
 *     tags: [Products]
 *     description: Yalnızca admin. Ürün silindiğinde Cloudinary görseli de cascade olarak silinir.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Ürün ve görseli silindi
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
 *                   example: Ürün ve görseli silindi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', roleMiddleware('admin'), productController.deleteProduct);

module.exports = router;
