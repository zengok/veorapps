import { Router } from 'express';
import { auth, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';

const router = Router();

router.get('/', auth, getProducts);
router.get('/:id', auth, getProductById);
router.post('/', auth, requireAdmin, upload.single('image'), createProduct);
router.put('/:id', auth, requireAdmin, upload.single('image'), updateProduct);
router.delete('/:id', auth, requireAdmin, deleteProduct);

export default router;
