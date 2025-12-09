// backend/src/utils/queryHelpers.ts
import { UserRole } from '@prisma/client';

/**
 * Utility functions for Row-Level Security (RLS) enforcement
 * These helpers ensure that Store Managers and Site Engineers can only access their assigned locations
 */

export interface AuthUser {
    id: number;
    role: UserRole;
    locationId?: number;
    email?: string;
}

/**
 * Build a location-scoped WHERE clause for Prisma queries
 * Automatically filters results based on user's role and assigned location
 * 
 * @param user - The authenticated user
 * @param baseWhere - Base WHERE conditions to merge with location filter
 * @returns Enhanced WHERE clause with location filtering
 */
export function buildLocationScopedWhere(user: AuthUser, baseWhere: any = {}): any {
    // Super Admin has unrestricted access
    if (user.role === UserRole.SUPER_ADMIN) {
        return baseWhere;
    }

    // Store Managers and Site Engineers must have a locationId
    if (!user.locationId) {
        // Return a WHERE clause that matches nothing
        return { ...baseWhere, id: -1 };
    }

    // Add location filtering for Store Managers and Site Engineers
    if (user.role === UserRole.STORE_MANAGER || user.role === UserRole.SITE_ENGINEER) {
        return {
            ...baseWhere,
            locationId: user.locationId
        };
    }

    return baseWhere;
}

/**
 * Validate if a user has access to a specific location
 * 
 * @param user - The authenticated user
 * @param targetLocationId - The location ID being accessed
 * @returns true if user can access the location, false otherwise
 */
export function validateLocationAccess(user: AuthUser, targetLocationId: number): boolean {
    // Super Admin can access all locations
    if (user.role === UserRole.SUPER_ADMIN) {
        return true;
    }

    // Store Managers and Site Engineers can only access their assigned location
    if (user.role === UserRole.STORE_MANAGER || user.role === UserRole.SITE_ENGINEER) {
        if (!user.locationId) {
            return false;
        }
        return user.locationId === targetLocationId;
    }

    // Unknown role - deny access
    return false;
}

/**
 * Get list of location IDs that the user can access
 * 
 * @param user - The authenticated user
 * @returns Array of accessible location IDs, or null for unrestricted access (Super Admin)
 */
export function getAccessibleLocationIds(user: AuthUser): number[] | null {
    // Super Admin can access all locations
    if (user.role === UserRole.SUPER_ADMIN) {
        return null; // null means unrestricted
    }

    // Store Managers and Site Engineers can only access their assigned location
    if (user.role === UserRole.STORE_MANAGER || user.role === UserRole.SITE_ENGINEER) {
        return user.locationId ? [user.locationId] : [];
    }

    return [];
}

/**
 * Extract target location ID from request parameters, query, or body
 * 
 * @param req - Express request object
 * @returns The target location ID or null if not found
 */
export function extractTargetLocationId(req: any): number | null {
    // Check URL parameters (e.g., /stores/:id)
    if (req.params?.id) {
        const id = parseInt(req.params.id);
        if (!isNaN(id)) return id;
    }

    // Check query parameters (e.g., ?locationId=123)
    if (req.query?.locationId) {
        const id = parseInt(req.query.locationId as string);
        if (!isNaN(id)) return id;
    }

    // Check request body
    if (req.body?.locationId) {
        const id = parseInt(req.body.locationId);
        if (!isNaN(id)) return id;
    }

    // Also check for storeId and siteId aliases
    if (req.body?.storeId) {
        const id = parseInt(req.body.storeId);
        if (!isNaN(id)) return id;
    }

    if (req.body?.siteId) {
        const id = parseInt(req.body.siteId);
        if (!isNaN(id)) return id;
    }

    if (req.query?.storeId) {
        const id = parseInt(req.query.storeId as string);
        if (!isNaN(id)) return id;
    }

    if (req.query?.siteId) {
        const id = parseInt(req.query.siteId as string);
        if (!isNaN(id)) return id;
    }

    return null;
}

/**
 * Sanitize and validate integer ID parameter
 * 
 * @param value - The value to validate
 * @param paramName - Name of the parameter (for error messages)
 * @returns The validated integer ID
 * @throws Error if invalid
 */
export function validateIntegerId(value: any, paramName: string = 'id'): number {
    const id = parseInt(value);
    if (isNaN(id) || id < 1) {
        throw new Error(`Invalid ${paramName}: must be a positive integer`);
    }
    return id;
}
