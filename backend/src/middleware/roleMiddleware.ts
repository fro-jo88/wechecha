// backend/src/middleware/roleMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: UserRole;
                locationId?: number;
            };
        }
    }
}

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    next();
};

export const requireStoreManager = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'STORE_MANAGER' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Store Manager or Super Admin required.' });
    }

    next();
};

export const requireSiteEngineer = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'SITE_ENGINEER' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Site Engineer or Super Admin required.' });
    }

    next();
};

export const requireManagerOrEngineer = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'STORE_MANAGER' &&
        req.user.role !== 'SITE_ENGINEER' &&
        req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Manager, Engineer, or Admin required.' });
    }

    next();
};
