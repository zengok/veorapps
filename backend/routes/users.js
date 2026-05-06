const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Kullanıcı yönetimi
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Kendi profilini görüntüle
 *     tags: [Users]
 *     description: Kimliği doğrulanmış kullanıcının profil bilgilerini döner.
 *     responses:
 *       200:
 *         description: Kullanıcı profili
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Profil güncelle
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: yeni@email.com
 *     responses:
 *       200:
 *         description: Profil güncellendi
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
 *                   example: Profil güncellendi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/profile', [
    body('email').optional().isEmail().withMessage('Geçerli bir e-posta girin')
], validate, userController.updateProfile);

// Admin only below
router.use(roleMiddleware('admin'));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Tüm kullanıcıları listele
 *     tags: [Users]
 *     description: Yalnızca admin erişebilir.
 *     responses:
 *       200:
 *         description: Kullanıcı listesi
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', userController.getAllUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Yeni kullanıcı oluştur
 *     tags: [Users]
 *     description: Yalnızca admin. Yeni kullanıcı sisteme ekler.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, email]
 *             properties:
 *               username:
 *                 type: string
 *                 example: yeni_kullanici
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Guclu123!
 *               email:
 *                 type: string
 *                 format: email
 *                 example: yeni@veor.com
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: Kullanıcı oluşturuldu
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
 *                   example: Kullanıcı oluşturuldu
 *       400:
 *         description: Kullanıcı adı veya e-posta zaten kullanımda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', [
    body('username').notEmpty().withMessage('Kullanıcı adı gerekli'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı')
], validate, userController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Kullanıcı güncelle
 *     tags: [Users]
 *     description: Yalnızca admin. Rol ve e-posta güncellenebilir.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Kullanıcı güncellendi
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
 *                   example: Kullanıcı güncellendi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Kullanıcı sil
 *     tags: [Users]
 *     description: Yalnızca admin.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Kullanıcı silindi
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
 *                   example: Kullanıcı silindi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', userController.deleteUser);

module.exports = router;
