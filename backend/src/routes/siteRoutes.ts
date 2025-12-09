import { Router } from 'express';
import {
    createSite,
    getAllSites,
    getSiteById,
    updateSite,
    deleteSite,
    finishSite
} from '../controllers/siteController';
import { requireSuperAdmin } from '../middleware/roleMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorizeLocationAccess } from '../middleware/accessControlMiddleware';

const router = Router();

router.use(authMiddleware);

// Create site (Super Admin only)
router.post('/', requireSuperAdmin, createSite);

// Get all sites (All authenticated users - filtered by controller)
router.get('/', getAllSites);

// Get site by ID (Protected by access control)
router.get('/:id', authorizeLocationAccess, getSiteById);

// Update site (Super Admin only)
router.put('/:id', requireSuperAdmin, updateSite);

// Delete site (Super Admin only)
router.delete('/:id', requireSuperAdmin, deleteSite);

// Finish site workflow (Super Admin only)
router.post('/:id/finish', requireSuperAdmin, finishSite);

export default router;

