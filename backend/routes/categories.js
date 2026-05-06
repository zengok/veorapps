const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

router.use(authMiddleware);

router.get('/', categoryController.getAllCategories);

const validateCategory = [
    body('name').trim().notEmpty().withMessage('Kategori adı gerekli')
];

router.post('/', roleMiddleware('admin'), validateCategory, validate, categoryController.createCategory);
router.put('/:id', roleMiddleware('admin'), validateCategory, validate, categoryController.updateCategory);
router.delete('/:id', roleMiddleware('admin'), categoryController.deleteCategory);

module.exports = router;
