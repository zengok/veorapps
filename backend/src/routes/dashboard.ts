import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getDashboard, resetDailyData } from '../controllers/dashboardController';

const router = Router();

router.get('/', auth, getDashboard);
router.post('/reset-daily', auth, resetDailyData);

export default router;
