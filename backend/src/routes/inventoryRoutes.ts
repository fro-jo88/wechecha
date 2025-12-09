import express from 'express';
import { adjustQuantity, transferAsset } from '../controllers/inventoryController';
import { requireManagerOrEngineer } from '../middleware/roleMiddleware';

const router = express.Router();

// Protected routes (Managers/Engineers/Admins)
router.use(requireManagerOrEngineer);

router.post('/adjust', adjustQuantity);
router.post('/transfer', transferAsset);

export default router;
