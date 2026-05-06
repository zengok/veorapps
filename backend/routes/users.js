const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

router.use(authMiddleware);

// Profile routes (Any authenticated user)
router.get('/profile', userController.getProfile);
router.put('/profile', [
    body('email').optional().isEmail().withMessage('Geçerli bir e-posta girin')
], validate, userController.updateProfile);

// Admin only routes
router.use(roleMiddleware('admin'));

router.get('/', userController.getAllUsers);
router.post('/', [
    body('username').notEmpty().withMessage('Kullanıcı adı gerekli'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı')
], validate, userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
