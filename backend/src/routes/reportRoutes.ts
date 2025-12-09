// backend/src/routes/reportRoutes.ts
import { Router } from 'express';
import { generatePDFReport } from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/:type/pdf', generatePDFReport);

export default router;
