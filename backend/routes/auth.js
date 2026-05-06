const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Çok fazla hatalı deneme, lütfen 15 dakika sonra tekrar deneyin.'
});

const passwordPolicy = [
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalı')
        .matches(/[A-Z]/).withMessage('En az bir büyük harf içermeli')
        .matches(/[0-9]/).withMessage('En az bir rakam içermeli')
        .matches(/[@$!%*?&#]/).withMessage('En az bir özel karakter içermeli')
];

router.post('/login', loginLimiter, [
    body('username').trim().notEmpty().withMessage('Kullanıcı adı gerekli'),
    body('password').notEmpty().withMessage('Şifre gerekli')
], validate, authController.login);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

router.post('/change-password', authMiddleware, passwordPolicy, validate, authController.changePassword);

module.exports = router;
