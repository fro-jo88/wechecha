// backend/src/controllers/storeController.ts
import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildLocationScopedWhere, validateLocationAccess } from '../utils/queryHelpers';
import { logSecurityViolation, createAuditLogFromRequest, AuditAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Create Store
export const createStore = async (req: Request, res: Response) => {
    try {
        const { name, region, managerId, status, description, address, newManager } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Store name is required' });
        }

        // Check if store name already exists
        const existing = await prisma.location.findFirst({
            where: { name, type: 'STORE' }
        });

        if (existing) {
            return res.status(400).json({ error: 'Store name already exists' });
        }

        const result = await prisma.$transaction(async (tx) => {
            let finalManagerId = managerId ? parseInt(managerId) : undefined;

            // Handle New Manager Creation
            if (newManager && newManager.email && newManager.password) {
                // Check if email exists
                const existingUser = await tx.user.findUnique({
                    where: { email: newManager.email }
                });

                if (existingUser) {
                    throw new Error('User with this email already exists');
                }

                const hashedPassword = await bcrypt.hash(newManager.password, 10);
                const user = await tx.user.create({
                    data: {
                        email: newManager.email,
                        name: newManager.name || 'Store Manager',
                        passwordHash: hashedPassword,
                        role: 'STORE_MANAGER',
                        isActive: true
                    }
                });
                finalManagerId = user.id;
            }

            // Create store
            const store = await tx.location.create({
                data: {
                    name,
                    type: 'STORE',
                    status: status || 'ACTIVE',
                    region,
                    description,
                    address,
                    managerId: finalManagerId,
                },
                include: {
                    manager: { select: { id: true, name: true, email: true } }
                }
            });

            // If we assigned a manager, update their locationId
            if (finalManagerId) {
                await tx.user.update({
                    where: { id: finalManagerId },
                    data: { locationId: store.id }
                });
            }

            return store;
        });

        return res.status(201).json({ message: 'Store created successfully', data: result });
    } catch (error: any) {
        console.error('Error creating store:', error);
        return res.status(500).json({ error: 'Failed to create store', details: error.message });
    }
};

// Get All Stores (with pagination)
export const getAllStores = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const where: any = { type: 'STORE' };

        // RBAC: If not SU, only see assigned store
        if (req.user?.role === 'STORE_MANAGER' && req.user.locationId) {
            where.id = req.user.locationId;
        }

        const [stores, total] = await Promise.all([
            prisma.location.findMany({
                where,
                skip,
                take: limit,
                include: {
                    manager: { select: { id: true, name: true, email: true } },
                    _count: { select: { inventory: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.location.count({ where })
        ]);

        return res.status(200).json({
            data: stores,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching stores:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Store by ID
export const getStoreById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = parseInt(id);

        if (isNaN(storeId)) {
            return res.status(400).json({ error: 'Invalid store ID' });
        }

        // RLS: Double-check location access (middleware should catch this, but belt-and-suspenders)
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!validateLocationAccess(req.user, storeId)) {
            logSecurityViolation(
                createAuditLogFromRequest(
                    req,
                    AuditAction.LOCATION_VIOLATION,
                    `Store:${storeId}`,
                    'Attempted to access store details without permission'
                )
            );
            return res.status(403).json({ error: 'Forbidden: You do not have access to this store.' });
        }

        const store = await prisma.location.findFirst({
            where: { id: storeId, type: 'STORE' },
            include: {
                manager: { select: { id: true, name: true, email: true } },
                inventory: {
                    include: {
                        product: true
                    }
                },
                _count: {
                    select: {
                        inventory: true,
                        transfersFrom: true,
                        transfersTo: true
                    }
                }
            }
        });

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        return res.status(200).json({ data: store });
    } catch (error: any) {
        console.error('Error fetching store:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update Store
export const updateStore = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = parseInt(id);
        const { name, region, managerId, status, description, address } = req.body;

        if (isNaN(storeId)) {
            return res.status(400).json({ error: 'Invalid store ID' });
        }

        // Check if store exists
        const existing = await prisma.location.findFirst({
            where: { id: storeId, type: 'STORE' }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Check if new name conflicts with another store
        if (name && name !== existing.name) {
            const nameConflict = await prisma.location.findFirst({
                where: { name, type: 'STORE', id: { not: storeId } }
            });

            if (nameConflict) {
                return res.status(400).json({ error: 'Store name already exists' });
            }
        }

        const store = await prisma.location.update({
            where: { id: storeId },
            data: {
                name,
                region,
                status,
                description,
                address,
                managerId: managerId ? parseInt(managerId) : undefined,
            },
            include: {
                manager: { select: { id: true, name: true, email: true } }
            }
        });

        return res.status(200).json({ message: 'Store updated successfully', data: store });
    } catch (error: any) {
        console.error('Error updating store:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete Store
export const deleteStore = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = parseInt(id);

        if (isNaN(storeId)) {
            return res.status(400).json({ error: 'Invalid store ID' });
        }

        // Check if store exists
        const store = await prisma.location.findFirst({
            where: { id: storeId, type: 'STORE' },
            include: { _count: { select: { inventory: true } } }
        });

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Check if store has inventory
        if (store._count.inventory > 0) {
            return res.status(400).json({
                error: 'Cannot delete store with inventory. Please transfer items first.',
                inventoryCount: store._count.inventory
            });
        }

        await prisma.location.delete({ where: { id: storeId } });

        return res.status(200).json({ message: 'Store deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting store:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Store Inventory
export const getStoreInventory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = parseInt(id);

        if (isNaN(storeId)) {
            return res.status(400).json({ error: 'Invalid store ID' });
        }

        // RLS: Validate location access
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!validateLocationAccess(req.user, storeId)) {
            logSecurityViolation(
                createAuditLogFromRequest(
                    req,
                    AuditAction.LOCATION_VIOLATION,
                    `StoreInventory:${storeId}`,
                    'Attempted to access store inventory without permission'
                )
            );
            return res.status(403).json({ error: 'Forbidden: You do not have access to this store inventory.' });
        }

        const inventory = await prisma.inventory.findMany({
            where: { locationId: storeId },
            include: {
                product: true,
                location: { select: { name: true, type: true } }
            },
            orderBy: { product: { name: 'asc' } }
        });

        return res.status(200).json({ data: inventory });
    } catch (error: any) {
        console.error('Error fetching store inventory:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
