import { Router } from 'express';
import { auth, requireAdmin } from '../middleware/auth';
import { getDashboard, resetSalesData } from '../controllers/dashboardController';

const router = Router();

router.get('/', auth, getDashboard);
router.post('/reset-sales', auth, requireAdmin, resetSalesData);

export default router;
