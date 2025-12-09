// backend/src/controllers/reportController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export const generatePDFReport = async (req: Request, res: Response) => {
    const { type } = req.params;
    const mainCategory = req.query.mainCategory as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    try {
        const doc = new PDFDocument({ margin: 50, layout: 'landscape' });

        // File styling
        const filename = `report-${type}-${Date.now()}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Wechecha Construction - System Report', { align: 'center' });
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        if (startDate && endDate) {
            doc.text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
        }
        if (mainCategory) {
            doc.text(`Category: ${mainCategory}`, { align: 'center' });
        }
        doc.moveDown();

        if (type === 'inventory') {
            doc.fontSize(16).text('Full Inventory Report', { underline: true });
            doc.moveDown();

            const where: any = {};
            if (mainCategory) {
                where.product = { mainCategory: mainCategory as any };
            }
            // Inventory usually doesn't have a date filter unless we filter by updated/created, but standard inventory report is current state.

            const inventory = await prisma.inventory.findMany({
                where,
                include: { product: true, location: true },
                orderBy: { location: { name: 'asc' } }
            });

            // Table Header
            const startX = 50;
            let currentY = doc.y;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Location', startX, currentY);
            doc.text('Type', startX + 150, currentY);
            doc.text('Product', startX + 250, currentY);
            doc.text('SKU', startX + 400, currentY);
            doc.text('Quantity', startX + 500, currentY);
            doc.moveDown();
            doc.font('Helvetica');

            // Rows
            inventory.forEach(item => {
                currentY = doc.y;
                doc.text(item.location.name, startX, currentY);
                doc.text(item.location.type, startX + 150, currentY);
                doc.text(item.product.name, startX + 250, currentY);
                doc.text(item.product.sku, startX + 400, currentY);
                doc.text(`${item.quantity} ${item.product.unit}`, startX + 500, currentY);
                doc.moveDown(0.5);
            });
        } else if (type === 'products') {
            doc.fontSize(16).text('Product Catalog Report', { underline: true });
            doc.moveDown();

            const where: any = {};
            if (mainCategory) {
                where.mainCategory = mainCategory as any;
            }
            if (startDate && endDate) {
                where.createdAt = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }

            const products = await prisma.product.findMany({
                where,
                orderBy: { name: 'asc' }
            });

            products.forEach(p => {
                doc.text(`${p.name} (${p.sku}) - ${p.category} - Price: $${p.price}`);
            });
        } else if (type === 'requests') {
            doc.fontSize(16).text('Assignment Requests Report', { underline: true });
            doc.moveDown();

            const where: any = {};
            if (startDate && endDate) {
                where.createdAt = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            if (mainCategory) {
                where.product = { mainCategory: mainCategory as any };
            }

            const requests = await prisma.inventoryRequest.findMany({
                where,
                include: { product: true, location: true, requestedBy: true },
                orderBy: { createdAt: 'desc' }
            });

            requests.forEach(r => {
                doc.text(`[${r.status}] ${new Date(r.createdAt).toLocaleDateString()} - ${r.product.name} -> ${r.location.name} (${r.quantity}) - By: ${r.requestedBy.name}`);
            });
        }

        // Footer
        doc.fontSize(10).text('End of Report', 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });

        doc.end();
    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    }
};
