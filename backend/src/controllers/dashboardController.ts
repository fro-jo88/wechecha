// backend/src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { buildLocationScopedWhere } from '../utils/queryHelpers';

const prisma = new PrismaClient();

// Get Super Admin Stats
export const getSuperAdminStats = async (req: Request, res: Response) => {
    try {
        const [
            totalStores,
            totalSites,
            totalProducts,
            totalInventory,
            pendingRequests
        ] = await Promise.all([
            prisma.location.count({ where: { type: 'STORE' } }),
            prisma.location.count({ where: { type: 'SITE' } }),
            prisma.product.count({ where: { status: 'ACTIVE' } }),
            prisma.inventory.aggregate({
                _count: true,
                _sum: { quantity: true }
            }),
            prisma.inventoryRequest.count({ where: { status: 'PENDING' } })
        ]);

        const stats = {
            totalStores,
            totalSites,
            totalProducts,
            totalInventoryRecords: totalInventory._count,
            totalInventoryQuantity: totalInventory._sum.quantity || 0,
            pendingRequests
        };

        return res.status(200).json({ data: stats });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Inventory Overview
export const getInventoryOverview = async (req: Request, res: Response) => {
    try {
        // RLS: Build location-scoped where clause
        const baseWhere = {};
        const where = buildLocationScopedWhere(req.user as any, baseWhere);

        const inventory = await prisma.inventory.findMany({
            where,
            include: {
                product: {
                    select: { id: true, name: true, sku: true, category: true, mainCategory: true, unit: true, defaultMinStock: true }
                },
                location: {
                    select: { id: true, name: true, type: true, region: true }
                }
            },
            orderBy: [
                { location: { name: 'asc' } },
                { product: { name: 'asc' } }
            ]
        });

        return res.status(200).json({ data: inventory });
    } catch (error: any) {
        console.error('Error fetching inventory overview:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Filtered Inventory
export const getFilteredInventory = async (req: Request, res: Response) => {
    try {
        const {
            storeId,
            siteId,
            productId,
            category,
            search,
            page = '1',
            limit = '50'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        let where: any = {};

        // Location filters
        if (storeId) {
            where.locationId = parseInt(storeId as string);
        } else if (siteId) {
            where.locationId = parseInt(siteId as string);
        }

        // RLS: Apply location scoping based on user role
        where = buildLocationScopedWhere(req.user as any, where);

        // Product filters
        if (productId) {
            where.productId = parseInt(productId as string);
        }

        if (category) {
            where.product = { category };
        }

        // Search
        if (search) {
            where.OR = [
                { product: { name: { contains: search as string } } },
                { product: { sku: { contains: search as string } } },
                { location: { name: { contains: search as string } } }
            ];
        }

        const [inventory, total] = await Promise.all([
            prisma.inventory.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    product: true,
                    location: {
                        select: { id: true, name: true, type: true, region: true }
                    }
                },
                orderBy: [
                    { location: { name: 'asc' } },
                    { product: { name: 'asc' } }
                ]
            }),
            prisma.inventory.count({ where })
        ]);

        return res.status(200).json({
            data: inventory,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        console.error('Error fetching filtered inventory:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
