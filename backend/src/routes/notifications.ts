import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getNotifications,
  deleteNotification,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';

const router = Router();

router.get('/', auth, getNotifications);
router.patch('/read-all', auth, markAllAsRead);
router.patch('/:id/read', auth, markAsRead);
router.delete('/:id', auth, deleteNotification);

export default router;
