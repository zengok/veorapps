import { Router } from 'express';
import { auth } from '../middleware/auth';
import { importFromExcel } from '../controllers/importController';

const router = Router();

// POST /api/import/excel  — Excel satırlarını JSON olarak alır, ürünleri upsert eder
router.post('/excel', auth, importFromExcel);

export default router;
