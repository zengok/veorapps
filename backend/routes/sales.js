const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Satış işlemleri
 */

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Tüm satışları listele
 *     tags: [Sales]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Satış listesi
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
 *                     $ref: '#/components/schemas/Sale'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', saleController.getAllSales);

/**
 * @swagger
 * /api/sales/export:
 *   get:
 *     summary: Satışları Excel olarak indir
 *     tags: [Sales]
 *     description: Yalnızca admin. Tüm satışları `.xlsx` formatında dışa aktarır.
 *     responses:
 *       200:
 *         description: Excel dosyası
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/export', roleMiddleware('admin'), saleController.exportExcel);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Satış detayı
 *     tags: [Sales]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Satış detayı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', saleController.getSaleDetails);

const validateSale = [
    body('product_id').isInt().withMessage('Ürün ID gerekli'),
    body('quantity').isInt({ min: 1 }).withMessage('Miktar en az 1 olmalı')
];

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Yeni satış oluştur
 *     tags: [Sales]
 *     description: |
 *       Satış oluşturur ve ilgili ürünün stok miktarını atomik olarak günceller.
 *       Stok yetersizse `400` hatası döner.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               discount:
 *                 type: number
 *                 description: İndirim tutarı (TL)
 *                 example: 50.00
 *               notes:
 *                 type: string
 *                 example: VIP müşteri indirimi
 *     responses:
 *       201:
 *         description: Satış kaydedildi
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
 *                   example: Satış kaydedildi
 *       400:
 *         description: Stok yetersiz
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Kritik Hata - Stok yetersiz veya tükenmiş!
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Ürün bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateSale, validate, saleController.createSale);

/**
 * @swagger
 * /api/sales/{id}/cancel:
 *   post:
 *     summary: Satışı iptal et
 *     tags: [Sales]
 *     description: Yalnızca admin. Satışı iptal eder ve stoku iade eder (transaction ile atomik).
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Satış iptal edildi ve stok iade edildi
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
 *                   example: Satış iptal edildi ve stok iade edildi
 *       400:
 *         description: Satış zaten iptal edilmiş
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/cancel', roleMiddleware('admin'), saleController.cancelSale);

module.exports = router;
