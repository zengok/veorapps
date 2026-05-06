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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Kimlik doğrulama işlemleri
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     tags: [Auth]
 *     security: []
 *     description: |
 *       Kullanıcı adı ve şifre ile giriş yapın. Başarılı girişte JWT access token ve refresh token döner.
 *       **Rate Limit:** 5 deneme / 15 dakika. 5 başarısız denemeden sonra hesap 15 dakika kilitlenir.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: batuhan
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Veor2024!
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                   description: JWT access token (1 saat geçerli)
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token (7 gün geçerli)
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Kullanıcı adı veya şifre hatalı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       423:
 *         description: Hesap kilitli (5 başarısız deneme)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Hesabınız kilitli. 12 dakika sonra tekrar deneyin.
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/login', loginLimiter, [
    body('username').trim().notEmpty().withMessage('Kullanıcı adı gerekli'),
    body('password').notEmpty().withMessage('Şifre gerekli')
], validate, authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Access token yenile
 *     tags: [Auth]
 *     security: []
 *     description: |
 *       Geçerli bir refresh token ile yeni access token + refresh token döner (token rotation).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Daha önce alınmış refresh token
 *     responses:
 *       200:
 *         description: Token yenilendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                   description: Yeni access token
 *                 refreshToken:
 *                   type: string
 *                   description: Yeni refresh token (eski geçersiz olur)
 *       403:
 *         description: Geçersiz veya süresi dolmuş refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Çıkış yap
 *     tags: [Auth]
 *     description: |
 *       Refresh token'ı geçersiz kılar ve mevcut access token'ı blacklist'e ekler.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Geçersiz kılınacak refresh token
 *     responses:
 *       200:
 *         description: Başarıyla çıkış yapıldı
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
 *                   example: Başarıyla çıkış yapıldı
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Şifre değiştir
 *     tags: [Auth]
 *     description: |
 *       Mevcut şifre doğrulandıktan sonra yeni şifre set eder.
 *       Başarılı işlem sonrası mevcut token geçersiz kılınır ve yeniden giriş gerekir.
 *       **Şifre politikası:** min 8 karakter, büyük harf, rakam ve özel karakter zorunlu.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: min 8 karakter, büyük/küçük harf, rakam ve özel karakter (@$!%*?&#)
 *     responses:
 *       200:
 *         description: Şifre güncellendi
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
 *                   example: Şifreniz başarıyla güncellendi. Lütfen tekrar giriş yapın.
 *       400:
 *         description: Şifre politikasına uymayan şifre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Mevcut şifre hatalı veya token geçersiz
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/change-password', authMiddleware, passwordPolicy, validate, authController.changePassword);

module.exports = router;
