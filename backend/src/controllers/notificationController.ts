// backend/src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = await (prisma as any).notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return res.status(200).json({ data: notifications });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        await (prisma as any).notification.updateMany({
            where: { id: parseInt(id), userId },
            data: { read: true }
        });

        return res.status(200).json({ message: 'Marked as read' });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
