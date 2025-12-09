// backend/src/routes/dashboardRoutes.ts
import { Router } from 'express';
import {
    getSuperAdminStats,
    getInventoryOverview,
    getFilteredInventory
} from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/stats', getSuperAdminStats);
router.get('/inventory', getInventoryOverview);
router.get('/inventory/filter', getFilteredInventory);

export default router;
