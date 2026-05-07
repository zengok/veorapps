import { Router } from 'express';
import { auth } from '../middleware/auth';
import { createSale, getSales } from '../controllers/saleController';

const router = Router();

router.post('/', auth, createSale);
router.get('/', auth, getSales);

export default router;
