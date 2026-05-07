import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createOrder,
  getOrders,
  completeOrder,
  cancelOrder,
} from '../controllers/orderController';

const router = Router();

router.post('/', auth, createOrder);
router.get('/', auth, getOrders);
router.patch('/:id/complete', auth, completeOrder);
router.delete('/:id', auth, cancelOrder);

export default router;
