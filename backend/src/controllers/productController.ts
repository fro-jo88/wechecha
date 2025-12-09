// backend/src/controllers/productController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate SKU
const generateSKU = async (category: string): Promise<string> => {
    const categoryMap: { [key: string]: string } = {
        'Building Materials': 'BLD',
        'Equipment': 'EQP',
        'Finishing': 'FIN',
        'Tools': 'TLS',
        'Safety': 'SFT'
    };

    const code = categoryMap[category] || 'GEN';

    // Get last product with this category
    const lastProduct = await prisma.product.findFirst({
        where: { sku: { startsWith: `PRD-${code}-` } },
        orderBy: { sku: 'desc' }
    });

    let nextNum = 1;
    if (lastProduct) {
        const match = lastProduct.sku.match(/PRD-[A-Z]+-(\d+)/);
        if (match) {
            nextNum = parseInt(match[1]) + 1;
        }
    }

    return `PRD-${code}-${nextNum.toString().padStart(3, '0')}`;
};

// Create Product
// Create Product
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, category, mainCategory, unit, description, price, defaultMinStock, status, locationId } = req.body;
        const user = (req as any).user;

        if (!name || !category || !unit) {
            return res.status(400).json({ error: 'Name, category, and unit are required' });
        }

        const sku = await generateSKU(category);

        // Determine initial status: If created by Store Manager (has locationId), it might be PENDING_APPROVAL
        // The user prompt implies: "When a product is created AND ASSIGNED to a store or site, its status should be set to 'Pending Approval'".
        // If the user creating it is a SUPER_ADMIN and assigns it, typically it's approved? 
        // But the prompt says: "When a product is created and assigned to a store or site, its status should be set to 'Pending Approval'."
        // Let's assume if locationId is provided, it goes to PENDING_APPROVAL unless explicitly set to ACTIVE/APPROVED by Super Admin.

        let initialStatus = status || 'ACTIVE';
        if (locationId) {
            // If locationId is provided, it needs approval unless user is Super Admin setting it explicitly to APPROVED/ACTIVE
            // But if Super Admin assigns it, maybe they want it approved immediately?
            // Prompt says: "Super Admin: View Pending...". "Store Manager: View Product Details Before Approval".
            // Implementation: Always PENDING if assigned to a specific location initially?
            // Let's stick to: If created by Store Manager (who has locationId), it's PENDING.
            // If Super Admin creates it, they might be assigning?
            // If Super Admin creates, they can set status = 'APPROVED' directly.

            if (user.role === 'SUPER_ADMIN') {
                // Trust the status passed, or default to ACTIVE/APPROVED
                initialStatus = status || 'APPROVED';
            } else {
                initialStatus = 'PENDING_APPROVAL';
            }
        }

        const product = await prisma.product.create({
            data: {
                name,
                sku,
                category,
                mainCategory: mainCategory || 'CONSUMABLE_GOODS',
                unit,
                description,
                price: price ? parseFloat(price) : 0,
                defaultMinStock: defaultMinStock ? parseInt(defaultMinStock) : 0,
                status: initialStatus
            }
        });

        // If locationId is provided, create initial inventory relationship
        if (locationId) {
            const locIdInt = parseInt(locationId);
            await prisma.inventory.create({
                data: {
                    productId: product.id,
                    locationId: locIdInt,
                    quantity: 0
                }
            });

            // Notification Logic
            if (initialStatus === 'PENDING_APPROVAL') {
                // If pending, it means a Store Manager created it (or Admin assigned it as pending).
                // Notify Super Admins
                const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
                await prisma.notification.createMany({
                    data: superAdmins.map(admin => ({
                        userId: admin.id,
                        type: 'INFO',
                        message: `New Product Pending Approval: ${product.name} (${product.sku}) assigned to location ${locIdInt}.`,
                        link: '/dashboard/superadmin/products?tab=pending',
                        read: false
                    }))
                });
            } else {
                // If Approved/Active immediately (By Super Admin), notify Manager
                const location = await prisma.location.findUnique({
                    where: { id: locIdInt },
                    select: { managerId: true, engineerId: true, name: true }
                });
                const recipientId = location?.managerId || location?.engineerId;
                if (recipientId) {
                    await prisma.notification.create({
                        data: {
                            userId: recipientId,
                            type: 'SUCCESS',
                            message: `New product ${product.name} assigned to your location.`,
                            link: `/dashboard/store/products`,
                            read: false
                        }
                    });
                }
            }
        }

        return res.status(201).json({ message: 'Product created successfully', data: product });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Approve Product
export const approveProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);
        const user = (req as any).user;

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Only Super Admin can approve
        if (user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Access denied. Only Super Admin can approve products.' });
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: { status: 'APPROVED' },
            include: {
                inventory: {
                    include: { location: { select: { managerId: true, engineerId: true } } }
                }
            }
        });

        // Notify Store Manager/Site Engineer
        const recipients = product.inventory
            .map(inv => inv.location.managerId || inv.location.engineerId)
            .filter((id): id is number => id !== null);

        // Deduplicate
        const uniqueRecipients = [...new Set(recipients)];

        if (uniqueRecipients.length > 0) {
            await prisma.notification.createMany({
                data: uniqueRecipients.map(userId => ({
                    userId,
                    type: 'SUCCESS',
                    message: `Product Approved: ${product.name} (${product.sku}).`,
                    link: `/dashboard/store/products`,
                    read: false
                }))
            });
        }

        return res.status(200).json({ message: 'Product approved successfully', data: product });
    } catch (error: any) {
        console.error('Error approving product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Reject Product
export const rejectProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);
        const user = (req as any).user;

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Only Super Admin can reject
        if (user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Access denied. Only Super Admin can reject products.' });
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: { status: 'REJECTED' },
            include: {
                inventory: {
                    include: { location: { select: { managerId: true, engineerId: true } } }
                }
            }
        });

        // Notify Store Manager/Site Engineer
        const recipients = product.inventory
            .map(inv => inv.location.managerId || inv.location.engineerId)
            .filter((id): id is number => id !== null);

        const uniqueRecipients = [...new Set(recipients)];

        if (uniqueRecipients.length > 0) {
            await prisma.notification.createMany({
                data: uniqueRecipients.map(userId => ({
                    userId,
                    type: 'WARNING',
                    message: `Product Rejected: ${product.name} (${product.sku}).`,
                    link: `/dashboard/store/products?tab=pending`, // Assuming they want to review rejected items
                    read: false
                }))
            });
        }

        return res.status(200).json({ message: 'Product rejected', data: product });
    } catch (error: any) {
        console.error('Error rejecting product:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Get All Products
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const category = req.query.category as string;
        const mainCategory = req.query.mainCategory as string;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const where: any = {};
        if (category) where.category = category;
        if (mainCategory) where.mainCategory = mainCategory;
        // Default to ACTIVE if status not specified
        if (status) {
            where.status = status;
        } else {
            // If no status specified, show ACTIVE and APPROVED (legacy support)
            where.status = { in: ['ACTIVE', 'APPROVED'] };
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { sku: { contains: search } },
                { description: { contains: search } }
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    _count: { select: { inventory: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        return res.status(200).json({
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Product by ID
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                inventory: {
                    include: {
                        location: { select: { id: true, name: true, type: true } }
                    }
                },
                _count: { select: { inventory: true, inventoryRequests: true } }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        return res.status(200).json({ data: product });
    } catch (error: any) {
        console.error('Error fetching product:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);
        const { name, category, mainCategory, unit, description, price, defaultMinStock, status } = req.body;

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                category,
                mainCategory,
                unit,
                description,
                price: price ? parseFloat(price) : undefined,
                defaultMinStock: defaultMinStock ? parseInt(defaultMinStock) : undefined,
                status
            }
        });

        return res.status(200).json({ message: 'Product updated successfully', data: product });
    } catch (error: any) {
        console.error('Error updating product:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete Product (Soft Delete - Set to INACTIVE)
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Soft delete by setting status to INACTIVE
        const product = await prisma.product.update({
            where: { id: productId },
            data: { status: 'INACTIVE' }
        });

        return res.status(200).json({ message: 'Product deactivated successfully', data: product });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
