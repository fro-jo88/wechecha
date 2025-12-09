import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateLocationAccess } from '../utils/queryHelpers';
import { logSecurityViolation, createAuditLogFromRequest, AuditAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Adjust Quantity (Deduct Consumables)
export const adjustQuantity = async (req: Request, res: Response) => {
    try {
        const { inventoryId, quantity, reason } = req.body;
        const user = (req as any).user;

        if (!inventoryId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Valid inventory ID and quantity are required' });
        }

        const inventory = await prisma.inventory.findUnique({
            where: { id: inventoryId },
            include: { product: true }
        });

        if (!inventory) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        // RBAC Check
        if (user.role !== 'SUPER_ADMIN') {
            if (!validateLocationAccess(user, inventory.locationId)) {
                return res.status(403).json({ error: 'Access denied: You cannot modify inventory at this location' });
            }
        }

        // Logic for Consumables vs Fixed Assets?
        // Consumables: Reduce quantity.
        // Fixed Assets: Usually q=1. If we adjust, maybe we are marking as "consumed"/broken?
        // For now, simple deduction logic.

        if (inventory.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        const updated = await prisma.inventory.update({
            where: { id: inventoryId },
            data: { quantity: { decrement: quantity } }
        });

        // Log usage (Audit or specialized Usage table? Audit for now)
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'INVENTORY_ADJUSTMENT',
                entityId: inventoryId.toString(),
                details: `Deducted ${quantity} ${inventory.product.unit} of ${inventory.product.name}. Reason: ${reason || 'Usage'}`
            }
        });

        return res.status(200).json({ message: 'Quantity adjusted successfully', data: updated });
    } catch (error: any) {
        console.error('Error adjusting inventory:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Transfer Asset (Move Fixed Asset or Bulk Consumables)
export const transferAsset = async (req: Request, res: Response) => {
    try {
        const { inventoryId, targetLocationId, quantity, reason } = req.body;
        const user = (req as any).user;

        if (!inventoryId || !targetLocationId) {
            return res.status(400).json({ error: 'Inventory ID and Target Location ID are required' });
        }

        const sourceInventory = await prisma.inventory.findUnique({
            where: { id: inventoryId },
            include: { product: true }
        });

        if (!sourceInventory) {
            return res.status(404).json({ error: 'Source inventory not found' });
        }

        // RBAC: Check source access
        if (user.role !== 'SUPER_ADMIN') {
            if (!validateLocationAccess(user, sourceInventory.locationId)) {
                return res.status(403).json({ error: 'Access denied: You cannot transfer from this location' });
            }
        }

        // Logic:
        // 1. Decrement source
        // 2. Increment target (or create if not valid)

        const qtyToTransfer = quantity || 1; // Default to 1 if not specified (typical for Fixed Assets)

        if (sourceInventory.quantity < qtyToTransfer) {
            return res.status(400).json({ error: 'Insufficient stock to transfer' });
        }

        await prisma.$transaction(async (tx) => {
            // Decrement Source
            await tx.inventory.update({
                where: { id: inventoryId },
                data: { quantity: { decrement: qtyToTransfer } }
            });

            // Handle Target
            const targetInventory = await tx.inventory.findFirst({
                where: {
                    productId: sourceInventory.productId,
                    locationId: parseInt(targetLocationId)
                }
            });

            if (targetInventory) {
                await tx.inventory.update({
                    where: { id: targetInventory.id },
                    data: { quantity: { increment: qtyToTransfer } }
                });
            } else {
                await tx.inventory.create({
                    data: {
                        productId: sourceInventory.productId,
                        locationId: parseInt(targetLocationId),
                        quantity: qtyToTransfer
                    }
                });
            }

            // Record Transfer in History (Transfer table?)
            // We have a Transfer model in schema? Let's check schema.
            // Assuming we use Transfer model or AuditLog.
            // Using AuditLog for simplicity unless Transfer model is strictly required (which usually implies a request/approval flow).
            // Prompt says "Maintain a history of movements".

            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'ASSET_TRANSFER',
                    entityId: sourceInventory.product.id.toString(), // Entity is Product or Inventory?
                    details: `Transferred ${qtyToTransfer} ${sourceInventory.product.unit} from Loc:${sourceInventory.locationId} to Loc:${targetLocationId}. Reason: ${reason}`
                }
            });
        });

        return res.status(200).json({ message: 'Transfer successful' });

    } catch (error: any) {
        console.error('Error transferring asset:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
