// backend/src/controllers/siteController.ts
import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildLocationScopedWhere, validateLocationAccess } from '../utils/queryHelpers';
import { logSecurityViolation, createAuditLogFromRequest, AuditAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Create Site
export const createSite = async (req: Request, res: Response) => {
    try {
        const { name, region, engineerId, status, description, address, newEngineer } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Site name is required' });
        }

        const existing = await prisma.location.findFirst({
            where: { name, type: 'SITE' }
        });

        if (existing) {
            return res.status(400).json({ error: 'Site name already exists' });
        }

        const result = await prisma.$transaction(async (tx) => {
            let finalEngineerId = engineerId ? parseInt(engineerId) : undefined;

            // Handle New Engineer Creation
            if (newEngineer && newEngineer.email && newEngineer.password) {
                const existingUser = await tx.user.findUnique({
                    where: { email: newEngineer.email }
                });

                if (existingUser) {
                    throw new Error('User with this email already exists');
                }

                const hashedPassword = await bcrypt.hash(newEngineer.password, 10);
                const user = await tx.user.create({
                    data: {
                        email: newEngineer.email,
                        name: newEngineer.name || 'Site Engineer',
                        passwordHash: hashedPassword,
                        role: 'SITE_ENGINEER',
                        isActive: true
                    }
                });
                finalEngineerId = user.id;
            }

            // Create site
            const site = await tx.location.create({
                data: {
                    name,
                    type: 'SITE',
                    status: status || 'ACTIVE',
                    region,
                    description,
                    address,
                    engineerId: finalEngineerId,
                },
                include: {
                    engineer: { select: { id: true, name: true, email: true } }
                }
            });

            // Update user location
            if (finalEngineerId) {
                await tx.user.update({
                    where: { id: finalEngineerId },
                    data: { locationId: site.id }
                });
            }

            return site;
        });

        return res.status(201).json({ message: 'Site created successfully', data: result });
    } catch (error: any) {
        console.error('Error creating site:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// GetAll Sites
export const getAllSites = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const where: any = { type: 'SITE' };

        // RBAC: If not SU, only see assigned site
        if (req.user?.role === 'SITE_ENGINEER' && req.user.locationId) {
            where.id = req.user.locationId;
        }

        const [sites, total] = await Promise.all([
            prisma.location.findMany({
                where,
                skip,
                take: limit,
                include: {
                    engineer: { select: { id: true, name: true, email: true } },
                    _count: { select: { inventory: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.location.count({ where })
        ]);

        return res.status(200).json({
            data: sites,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching sites:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Site by ID
export const getSiteById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const siteId = parseInt(id);

        if (isNaN(siteId)) {
            return res.status(400).json({ error: 'Invalid site ID' });
        }

        // RLS: Double-check location access
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!validateLocationAccess(req.user, siteId)) {
            logSecurityViolation(
                createAuditLogFromRequest(
                    req,
                    AuditAction.LOCATION_VIOLATION,
                    `Site:${siteId}`,
                    'Attempted to access site details without permission'
                )
            );
            return res.status(403).json({ error: 'Forbidden: You do not have access to this site.' });
        }

        const site = await prisma.location.findFirst({
            where: { id: siteId, type: 'SITE' },
            include: {
                engineer: { select: { id: true, name: true, email: true } },
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

        if (site && site.status === 'COMPLETED' && req.user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Access denied. This site is finished and can only be viewed by Super Admins.' });
        }

        if (!site) {
            return res.status(404).json({ error: 'Site not found' });
        }

        return res.status(200).json({ data: site });
    } catch (error: any) {
        console.error('Error fetching site:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update Site
export const updateSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const siteId = parseInt(id);
        const { name, region, engineerId, status, description, address } = req.body;

        if (isNaN(siteId)) {
            return res.status(400).json({ error: 'Invalid site ID' });
        }

        const existing = await prisma.location.findFirst({
            where: { id: siteId, type: 'SITE' }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Site not found' });
        }

        if (name && name !== existing.name) {
            const nameConflict = await prisma.location.findFirst({
                where: { name, type: 'SITE', id: { not: siteId } }
            });

            if (nameConflict) {
                return res.status(400).json({ error: 'Site name already exists' });
            }
        }

        const site = await prisma.location.update({
            where: { id: siteId },
            data: {
                name,
                region,
                status,
                description,
                address,
                engineerId: engineerId ? parseInt(engineerId) : undefined,
            },
            include: {
                engineer: { select: { id: true, name: true, email: true } }
            }
        });

        return res.status(200).json({ message: 'Site updated successfully', data: site });
    } catch (error: any) {
        console.error('Error updating site:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete Site
export const deleteSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const siteId = parseInt(id);

        if (isNaN(siteId)) {
            return res.status(400).json({ error: 'Invalid site ID' });
        }

        const site = await prisma.location.findFirst({
            where: { id: siteId, type: 'SITE' },
            include: { _count: { select: { inventory: true } } }
        });

        if (!site) {
            return res.status(404).json({ error: 'Site not found' });
        }

        if (site._count.inventory > 0) {
            return res.status(400).json({
                error: 'Cannot delete site with inventory. Please transfer items first.',
                inventoryCount: site._count.inventory
            });
        }

        await prisma.location.delete({ where: { id: siteId } });

        return res.status(200).json({ message: 'Site deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting site:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Finish Site Workflow
 * 1. Check if Inventory > 0
 * 2. If 0, update status to COMPLETED
 * 3. Disable associated users
 */
export const finishSite = async (req: Request, res: Response) => {
    const { id } = req.params;
    const locationId = parseInt(id, 10);

    // Validate that ID is a valid number
    if (isNaN(locationId)) {
        return res.status(400).json({ error: "Invalid location ID" });
    }

    try {
        // 1. Check Inventory
        const inventoryAggregate = await prisma.inventory.aggregate({
            where: {
                locationId: locationId,
            },
            _sum: {
                quantity: true,
            },
        });

        const totalQuantity = inventoryAggregate._sum?.quantity || 0;

        if (totalQuantity > 0) {
            return res.status(400).json({
                error: "Cannot finish site. Inventory is not empty.",
                details: `There are still ${totalQuantity} items at this site. Please transfer them to a store first.`,
                remainingStock: totalQuantity
            });
        }

        // 2. Transaction to Update Location and Disable Users
        const result = await prisma.$transaction(async (tx) => {
            // Update Location Status
            const updatedLocation = await tx.location.update({
                where: { id: locationId },
                data: {
                    status: 'COMPLETED',
                },
            });

            // Disable Access for Site Engineers assigned to this site
            const updatedUsers = await tx.user.updateMany({
                where: {
                    locationId: locationId,
                    role: 'SITE_ENGINEER',
                },
                data: {
                    isActive: false,
                },
            });

            return { location: updatedLocation, usersAffected: updatedUsers.count };
        });

        return res.status(200).json({
            message: "Site finished successfully.",
            data: result,
        });

    } catch (error) {
        console.error("Error finishing site:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
