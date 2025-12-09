import { Router } from 'express';
import {
    createStore,
    getAllStores,
    getStoreById,
    updateStore,
    deleteStore,
    getStoreInventory
} from '../controllers/storeController';
import { requireSuperAdmin } from '../middleware/roleMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizeLocationAccess } from '../middleware/accessControlMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create store (Super Admin only)
router.post('/', requireSuperAdmin, createStore);

// Get all stores (All authenticated users - filtered by controller)
router.get('/', getAllStores);

// Get store by ID (Protected by access control)
router.get('/:id', authorizeLocationAccess, getStoreById);

// Get store inventory (Protected by access control)
router.get('/:id/inventory', authorizeLocationAccess, getStoreInventory);

// Update store (Super Admin only)
router.put('/:id', requireSuperAdmin, updateStore);

// Delete store (Super Admin only)
router.delete('/:id', requireSuperAdmin, deleteStore);

export default router;

