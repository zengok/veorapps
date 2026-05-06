const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Kategori yönetimi
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Tüm kategorileri listele
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Kategori listesi (alfabetik sıralı)
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
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', categoryController.getAllCategories);

const validateCategory = [
    body('name').trim().notEmpty().withMessage('Kategori adı gerekli')
];

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Yeni kategori oluştur
 *     tags: [Categories]
 *     description: Yalnızca admin erişebilir.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Oryantal
 *               description:
 *                 type: string
 *                 example: Oryantal parfüm koleksiyonu
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Kategori oluşturuldu
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
 *                   example: Kategori oluşturuldu
 *       400:
 *         description: Bu isimde bir kategori zaten var
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', roleMiddleware('admin'), validateCategory, validate, categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Kategori güncelle
 *     tags: [Categories]
 *     description: Yalnızca admin erişebilir.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kategori güncellendi
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
 *                   example: Kategori güncellendi
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', roleMiddleware('admin'), validateCategory, validate, categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Kategori sil
 *     tags: [Categories]
 *     description: |
 *       Yalnızca admin. Kategoriye bağlı ürünler varsa silinemez (`400` döner).
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Kategori silindi
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
 *                   example: Kategori silindi
 *       400:
 *         description: Kategoriye bağlı ürünler var
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
router.delete('/:id', roleMiddleware('admin'), categoryController.deleteCategory);

module.exports = router;
