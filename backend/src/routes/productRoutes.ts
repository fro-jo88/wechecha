// backend/src/routes/productRoutes.ts
import { Router } from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    approveProduct,
    rejectProduct
} from '../controllers/productController';
import { requireSuperAdmin } from '../middleware/roleMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', requireSuperAdmin, createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', requireSuperAdmin, updateProduct);
router.put('/:id/approve', approveProduct); // Allow Store Admins too? Yes, based on requirements.
router.put('/:id/reject', rejectProduct);
router.delete('/:id', requireSuperAdmin, deleteProduct);

export default router;
