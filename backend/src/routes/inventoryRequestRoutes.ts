// backend/src/routes/inventoryRequestRoutes.ts
import { Router } from 'express';
import {
    createRequest,
    getAllRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    getPendingRequestsForUser
} from '../controllers/inventoryRequestController';
import { requireSuperAdmin, requireManagerOrEngineer } from '../middleware/roleMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Base pathwill be /api/requests

router.post('/', requireSuperAdmin, createRequest); // POST /api/requests
router.get('/', getAllRequests); // GET /api/requests
router.get('/pending', requireManagerOrEngineer, getPendingRequestsForUser); // GET /api/requests/pending
router.get('/:id', getRequestById); // GET /api/requests/:id
router.put('/:id/approve', requireManagerOrEngineer, approveRequest); // PUT /api/requests/:id/approve
router.put('/:id/reject', requireManagerOrEngineer, rejectRequest); // PUT /api/requests/:id/reject

export default router;
