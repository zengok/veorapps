import { Router } from 'express';
import { auth, requireAdmin } from '../middleware/auth';
import { getAuditLogs } from '../controllers/auditLogController';

const router = Router();

router.get('/', auth, requireAdmin, getAuditLogs);

export default router;
