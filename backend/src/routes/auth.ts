import { Router } from 'express';
import { body } from 'express-validator';
import { login, me } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

const loginValidation = [
  body('email').isEmail().withMessage('Geçerli bir e-posta girin').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
];

router.post('/login', loginValidation, login);
router.get('/me', auth, me);

export default router;
