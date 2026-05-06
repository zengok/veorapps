const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

router.use(authMiddleware);

router.get('/', saleController.getAllSales);
router.get('/export', roleMiddleware('admin'), saleController.exportExcel);
router.get('/:id', saleController.getSaleDetails);

const validateSale = [
    body('product_id').isInt().withMessage('Ürün ID gerekli'),
    body('quantity').isInt({ min: 1 }).withMessage('Miktar en az 1 olmalı')
];

router.post('/', validateSale, validate, saleController.createSale);
router.post('/:id/cancel', roleMiddleware('admin'), saleController.cancelSale);

module.exports = router;
