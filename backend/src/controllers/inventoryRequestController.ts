// backend/src/controllers/inventoryRequestController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Inventory Request (Super Admin assigns product to location)
export const createRequest = async (req: Request, res: Response) => {
    try {
        const { productId, locationId, quantity } = req.body;
        const requestedById = req.user?.id;

        if (!productId || !locationId || !quantity) {
            return res.status(400).json({ error: 'Product, location, and quantity are required' });
        }

        if (!requestedById) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const request = await prisma.inventoryRequest.create({
            data: {
                productId: parseInt(productId),
                locationId: parseInt(locationId),
                quantity: parseInt(quantity),
                requestedById,
                status: 'PENDING'
            },
            include: {
                product: true,
                location: { select: { id: true, name: true, type: true } },
                requestedBy: { select: { id: true, name: true, email: true } }
            }
        });

        return res.status(201).json({ message: 'Inventory request created successfully', data: request });
    } catch (error: any) {
        console.error('Error creating inventory request:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get All Requests (filtered by user role)
export const getAllRequests = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const status = req.query.status as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        // Filter by location for managers and engineers
        if (user?.role === 'STORE_MANAGER' || user?.role === 'SITE_ENGINEER') {
            if (user.locationId) {
                where.locationId = user.locationId;
            }
        }

        const [requests, total] = await Promise.all([
            prisma.inventoryRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    product: true,
                    location: { select: { id: true, name: true, type: true } },
                    requestedBy: { select: { id: true, name: true, email: true } },
                    approvedBy: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.inventoryRequest.count({ where })
        ]);

        return res.status(200).json({
            data: requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching requests:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Request by ID
export const getRequestById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requestId = parseInt(id);

        if (isNaN(requestId)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        const request = await prisma.inventoryRequest.findUnique({
            where: { id: requestId },
            include: {
                product: true,
                location: { select: { id: true, name: true, type: true } },
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Access Control: Managers/Engineers can only see requests for their location
        if (req.user?.role === 'STORE_MANAGER' || req.user?.role === 'SITE_ENGINEER') {
            if (req.user.locationId !== request.locationId) {
                return res.status(403).json({ error: 'Forbidden: access denied' });
            }
        }

        return res.status(200).json({ data: request });
    } catch (error: any) {
        console.error('Error fetching request:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};


// Approve Request (creates/updates inventory)
export const approveRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requestId = parseInt(id);
        const approvedById = req.user?.id;

        if (isNaN(requestId)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        if (!approvedById) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const request = await prisma.inventoryRequest.findUnique({
            where: { id: requestId },
            include: { location: true }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request has already been processed' });
        }

        // Verify user has permission for this location
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.locationId !== request.locationId) {
            return res.status(403).json({ error: 'You can only approve requests for your assigned location' });
        }

        // Update request and inventory in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update request status
            const updatedRequest = await tx.inventoryRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    approvedById
                },
                include: {
                    product: true,
                    location: { select: { name: true } },
                    approvedBy: { select: { name: true } }
                }
            });

            // Check if inventory exists
            const existingInventory = await tx.inventory.findUnique({
                where: {
                    locationId_productId: {
                        locationId: request.locationId,
                        productId: request.productId
                    }
                }
            });

            if (existingInventory) {
                // Update existing inventory
                await tx.inventory.update({
                    where: { id: existingInventory.id },
                    data: {
                        quantity: existingInventory.quantity + request.quantity
                    }
                });
            } else {
                // Create new inventory record
                await tx.inventory.create({
                    data: {
                        locationId: request.locationId,
                        productId: request.productId,
                        quantity: request.quantity
                    }
                });
            }

            return updatedRequest;
        });

        return res.status(200).json({
            message: 'Request approved and inventory updated',
            data: result
        });
    } catch (error: any) {
        console.error('Error approving request:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Reject Request
export const rejectRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requestId = parseInt(id);
        const approvedById = req.user?.id;

        if (isNaN(requestId)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        if (!approvedById) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const request = await prisma.inventoryRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request has already been processed' });
        }

        // Verify user has permission
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.locationId !== request.locationId) {
            return res.status(403).json({ error: 'You can only reject requests for your assigned location' });
        }

        const updatedRequest = await prisma.inventoryRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                approvedById
            },
            include: {
                product: true,
                location: { select: { name: true } },
                approvedBy: { select: { name: true } }
            }
        });

        return res.status(200).json({
            message: 'Request rejected',
            data: updatedRequest
        });
    } catch (error: any) {
        console.error('Error rejecting request:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Pending Requests for Current User's Location
export const getPendingRequestsForUser = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user?.locationId) {
            return res.status(200).json({ data: [] });
        }

        const requests = await prisma.inventoryRequest.findMany({
            where: {
                locationId: user.locationId,
                status: 'PENDING'
            },
            include: {
                product: true,
                location: { select: { name: true } },
                requestedBy: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        return res.status(200).json({ data: requests });
    } catch (error: any) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
