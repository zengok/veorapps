import { Router } from 'express';
import { auth } from '../middleware/auth';
import { createSale, exportMonthlySales, getSales } from '../controllers/saleController';

const router = Router();

router.post('/', auth, createSale);
router.get('/export/monthly', auth, exportMonthlySales);
router.get('/', auth, getSales);

export default router;
