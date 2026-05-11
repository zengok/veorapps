import { Router } from 'express';
import { auth, requireAdmin } from '../middleware/auth';
import { getMonthlyTarget, updateMonthlyTarget } from '../controllers/settingsController';

const router = Router();

router.get('/monthly-target', auth, requireAdmin, getMonthlyTarget);
router.put('/monthly-target', auth, requireAdmin, updateMonthlyTarget);

export default router;
