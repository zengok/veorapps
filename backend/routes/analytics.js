const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Satış ve performans analitiği (Yalnızca admin)
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Dashboard özet metrikleri
 *     tags: [Analytics]
 *     description: Toplam satış, gelir, ürün sayısı ve düşük stok uyarısı.
 *     responses:
 *       200:
 *         description: Dashboard verileri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsDashboard'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/dashboard', analyticsController.getDashboard);

/**
 * @swagger
 * /api/analytics/sales-trend:
 *   get:
 *     summary: Günlük satış trendi (son 30 gün)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Günlük satış trendi verisi
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
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: '2026-05-06'
 *                       revenue:
 *                         type: number
 *                         example: 4500.00
 *                       sales_count:
 *                         type: integer
 *                         example: 12
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/sales-trend', analyticsController.getSalesTrend);

/**
 * @swagger
 * /api/analytics/top-products:
 *   get:
 *     summary: En çok satan 10 ürün
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: En çok satan ürünler
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
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Veor Classic 50ml
 *                       total_sold:
 *                         type: integer
 *                         example: 48
 *                       total_revenue:
 *                         type: number
 *                         example: 21600.00
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/top-products', analyticsController.getTopProducts);

/**
 * @swagger
 * /api/analytics/top-sellers:
 *   get:
 *     summary: En çok satan 10 personel
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: En yüksek ciro yapan satıcılar
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
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                         example: batuhan
 *                       sales_count:
 *                         type: integer
 *                         example: 32
 *                       total_revenue:
 *                         type: number
 *                         example: 14400.00
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/top-sellers', analyticsController.getTopSellers);

module.exports = router;
