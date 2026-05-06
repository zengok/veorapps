const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin')); // Only admins can see detailed analytics

router.get('/dashboard', analyticsController.getDashboard);
router.get('/sales-trend', analyticsController.getSalesTrend);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/top-sellers', analyticsController.getTopSellers);

module.exports = router;
