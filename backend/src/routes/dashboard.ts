import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getDashboard, resetSalesData } from '../controllers/dashboardController';

const router = Router();

router.get('/', auth, getDashboard);
router.post('/reset-sales', auth, resetSalesData);

export default router;
