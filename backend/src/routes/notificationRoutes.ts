// backend/src/routes/notificationRoutes.ts
import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

export default router;
