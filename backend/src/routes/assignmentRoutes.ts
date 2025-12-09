// backend/src/routes/assignmentRoutes.ts
import { Router } from 'express';
import { createAssignment, getAssignments, approveAssignment, rejectAssignment } from '../controllers/assignmentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createAssignment);
router.get('/', getAssignments);
router.put('/:id/approve', approveAssignment);
router.put('/:id/reject', rejectAssignment);

export default router;
