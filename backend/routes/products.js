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
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', productController.getAllProducts);
router.get('/low-stock', roleMiddleware('admin'), productController.getLowStock);
router.get('/:id', productController.getProduct);

const validateProduct = [
    body('name').trim().notEmpty().withMessage('Ürün adı gerekli'),
    body('price').isFloat({ min: 0 }).withMessage('Geçerli bir fiyat girin'),
    body('stock').isInt({ min: 0 }).withMessage('Geçerli bir stok girin')
];

router.post('/', roleMiddleware('admin'), upload.single('image'), validateProduct, validate, productController.createProduct);
router.put('/:id', roleMiddleware('admin'), upload.single('image'), validateProduct, validate, productController.updateProduct);
router.delete('/:id', roleMiddleware('admin'), productController.deleteProduct);

module.exports = router;
