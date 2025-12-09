// backend/src/utils/auditLogger.ts
import { PrismaClient } from '@prisma/client';
import { AuthUser } from './queryHelpers';

const prisma = new PrismaClient();

/**
 * Security audit logging utilities
 * Logs unauthorized access attempts and security violations for monitoring and compliance
 */

export enum AuditAction {
    ACCESS_DENIED = 'ACCESS_DENIED',
    LOCATION_VIOLATION = 'LOCATION_VIOLATION',
    UNAUTHORIZED_ATTEMPT = 'UNAUTHORIZED_ATTEMPT',
    PARAMETER_TAMPERING = 'PARAMETER_TAMPERING',
    DATA_ACCESS = 'DATA_ACCESS',
    PERMISSION_VIOLATION = 'PERMISSION_VIOLATION'
}

interface AuditLogData {
    user: AuthUser;
    action: AuditAction;
    resource: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log a security violation
 * 
 * @param data - Audit log data
 */
export async function logSecurityViolation(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.user.id,
                action: data.action,
                resource: data.resource,
                details: data.details || null,
                ipAddress: data.ipAddress || null,
                userAgent: data.userAgent || null
            }
        });

        // Also log to console for real-time monitoring
        console.warn(`[SECURITY VIOLATION] User ${data.user.email || data.user.id} (${data.user.role}): ${data.action} on ${data.resource}`,
            data.details ? `- ${data.details}` : ''
        );
    } catch (error) {
        // Don't throw errors from audit logging - just log to console
        console.error('Failed to create audit log:', error);
    }
}

/**
 * Log a successful data access for sensitive operations
 * 
 * @param data - Audit log data
 */
export async function logDataAccess(data: AuditLogData): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.user.id,
                action: data.action,
                resource: data.resource,
                details: data.details || null,
                ipAddress: data.ipAddress || null,
                userAgent: data.userAgent || null
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
}

/**
 * Helper to create audit log data from Express request
 * 
 * @param req - Express request object
 * @param action - Audit action
 * @param resource - Resource being accessed
 * @param details - Additional details
 */
export function createAuditLogFromRequest(
    req: any,
    action: AuditAction,
    resource: string,
    details?: string
): AuditLogData {
    return {
        user: req.user,
        action,
        resource,
        details,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent')
    };
}

/**
 * Get recent security violations for a user
 * 
 * @param userId - User ID
 * @param limit - Number of records to return
 */
export async function getUserViolations(userId: number, limit: number = 10) {
    return await prisma.auditLog.findMany({
        where: {
            userId,
            action: {
                in: [
                    AuditAction.ACCESS_DENIED,
                    AuditAction.LOCATION_VIOLATION,
                    AuditAction.UNAUTHORIZED_ATTEMPT,
                    AuditAction.PARAMETER_TAMPERING,
                    AuditAction.PERMISSION_VIOLATION
                ]
            }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            user: {
                select: { email: true, name: true, role: true }
            }
        }
    });
}

/**
 * Get all security violations within a time range
 * 
 * @param startDate - Start date
 * @param endDate - End date
 */
export async function getViolationsInRange(startDate: Date, endDate: Date) {
    return await prisma.auditLog.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            action: {
                in: [
                    AuditAction.ACCESS_DENIED,
                    AuditAction.LOCATION_VIOLATION,
                    AuditAction.UNAUTHORIZED_ATTEMPT,
                    AuditAction.PARAMETER_TAMPERING,
                    AuditAction.PERMISSION_VIOLATION
                ]
            }
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { email: true, name: true, role: true }
            }
        }
    });
}
