// backend/src/controllers/assignmentController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Assignment Request (Site Engineer / Store Manager requests a product)
export const createAssignment = async (req: Request, res: Response) => {
    try {
        const { productId, quantity, notes } = req.body;
        const requestedById = req.user?.id;
        const userRole = req.user?.role;
        const userLocationId = req.user?.locationId;

        if (!productId || !quantity || !userLocationId) {
            return res.status(400).json({ error: 'Product, quantity, and assigned location are required' });
        }

        const request = await prisma.inventoryRequest.create({
            data: {
                productId: parseInt(productId),
                locationId: userLocationId,
                quantity: parseInt(quantity),
                requestedById: requestedById!,
                status: 'PENDING'
            },
            include: {
                product: { select: { name: true } },
                location: { select: { name: true } },
                requestedBy: { select: { name: true } }
            }
        });

        // Notify Super Admin
        const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
        await (prisma as any).notification.createMany({
            data: superAdmins.map(admin => ({
                userId: admin.id,
                message: `New product assignment request: ${request.product.name} for ${request.location.name} by ${request.requestedBy.name}`,
                type: 'INFO',
                link: `/dashboard/superadmin/assignments`
            }))
        });

        return res.status(201).json({ message: 'Request submitted successfully', data: request });
    } catch (error: any) {
        console.error('Error creating assignment:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// List Assignments
export const getAssignments = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const where: any = {};

        if (status) where.status = status;

        // RBAC: Stores/Sites see only theirs
        if (req.user?.role !== 'SUPER_ADMIN') {
            if (req.user?.locationId) {
                where.locationId = req.user.locationId;
            } else {
                return res.status(200).json({ data: [] });
            }
        }

        const assignments = await prisma.inventoryRequest.findMany({
            where,
            include: {
                product: true,
                location: true,
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({ data: assignments });
    } catch (error: any) {
        console.error('Error fetching assignments:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Approve Assignment
export const approveAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requestId = parseInt(id);
        const approvedById = req.user?.id;

        const request = await prisma.inventoryRequest.findUnique({
            where: { id: requestId },
            include: { location: true, product: true }
        });

        if (!request || request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid request or already processed' });
        }

        await prisma.$transaction(async (tx) => {
            // Update request
            await tx.inventoryRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED', approvedById }
            });

            // Update/Create Inventory
            const existingInventory = await tx.inventory.findUnique({
                where: {
                    locationId_productId: {
                        locationId: request.locationId,
                        productId: request.productId
                    }
                }
            });

            if (existingInventory) {
                await tx.inventory.update({
                    where: { id: existingInventory.id },
                    data: { quantity: existingInventory.quantity + request.quantity }
                });
            } else {
                await tx.inventory.create({
                    data: {
                        locationId: request.locationId,
                        productId: request.productId,
                        quantity: request.quantity
                    }
                });
            }

            // Notify Requester
            await (tx as any).notification.create({
                data: {
                    userId: request.requestedById,
                    message: `Your request for ${request.product.name} has been approved.`,
                    type: 'SUCCESS',
                    link: request.location.type === 'STORE' ? `/dashboard/store` : `/dashboard/site`
                }
            });
        });

        return res.status(200).json({ message: 'Assignment approved' });
    } catch (error: any) {
        console.error('Error approving assignment:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Reject Assignment
export const rejectAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requestId = parseInt(id);
        const approvedById = req.user?.id;

        const request = await prisma.inventoryRequest.findUnique({
            where: { id: requestId },
            include: { product: true }
        });

        if (!request || request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid request or already processed' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.inventoryRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED', approvedById }
            });

            // Notify Requester
            await (tx as any).notification.create({
                data: {
                    userId: request.requestedById,
                    message: `Your request for ${request.product.name} has been rejected.`,
                    type: 'ERROR',
                    link: '#' // No specific link
                }
            });
        });

        return res.status(200).json({ message: 'Assignment rejected' });
    } catch (error: any) {
        console.error('Error rejecting assignment:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
