import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { UserRole } from "@prisma/client";
import { validateLocationAccess, extractTargetLocationId } from "../utils/queryHelpers";
import { logSecurityViolation, createAuditLogFromRequest, AuditAction } from "../utils/auditLogger";

/**
 * Enhanced middleware to enforce strict location-based access control.
 * 
 * Rules:
 * - SUPER_ADMIN: Can access everything.
 * - STORE_MANAGER: Can only access resources where locationId matches their assigned store.
 * - SITE_ENGINEER: Can only access resources where locationId matches their assigned site.
 * 
 * Features:
 * - Validates URL parameters, query strings, and request body
 * - Logs security violations for auditing
 * - Protects against parameter tampering
 * - Returns 403 Forbidden for unauthorized access
 */
export const authorizeLocationAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized: Authentication required" });
        }

        // Super Admin has full access - bypass all checks
        if (user.role === UserRole.SUPER_ADMIN) {
            return next();
        }

        // Extract target location ID from various sources
        const targetLocationId = extractTargetLocationId(req);

        // If no location ID found, this might be a list endpoint
        // Let the controller handle filtering
        if (!targetLocationId) {
            return next();
        }

        // Validate format
        if (isNaN(targetLocationId) || targetLocationId < 1) {
            return res.status(400).json({ error: "Invalid location ID format" });
        }

        // Check if user has permission to access this location
        if (!validateLocationAccess(user, targetLocationId)) {
            // Log security violation
            logSecurityViolation(
                createAuditLogFromRequest(
                    req,
                    AuditAction.LOCATION_VIOLATION,
                    `Location:${targetLocationId}`,
                    `User attempted to access location ${targetLocationId} but is assigned to location ${user.locationId || 'none'}`
                )
            );

            return res.status(403).json({
                error: "Forbidden: You do not have permission to access this location.",
                message: "Access denied. You can only access resources for your assigned location."
            });
        }

        // Access granted
        next();
    } catch (error) {
        console.error("Access Control Error:", error);
        return res.status(500).json({ error: "Internal server error during authorization" });
    }
};

/**
 * Middleware to validate that Store Managers and Site Engineers have a locationId assigned
 * Should be used on routes that require location context
 */
export const requireLocationAssignment = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Super Admin doesn't need location assignment
        if (user.role === UserRole.SUPER_ADMIN) {
            return next();
        }

        // Store Managers and Site Engineers must have a location assigned
        if (user.role === UserRole.STORE_MANAGER || user.role === UserRole.SITE_ENGINEER) {
            if (!user.locationId) {
                // Log this as a security issue
                logSecurityViolation(
                    createAuditLogFromRequest(
                        req,
                        AuditAction.PERMISSION_VIOLATION,
                        'LocationRequired',
                        'User attempted to access location-specific resource without location assignment'
                    )
                );

                return res.status(403).json({
                    error: "Forbidden: No location assigned to your account.",
                    message: "Please contact an administrator to assign a location to your account."
                });
            }
        }

        next();
    } catch (error) {
        console.error("Location Assignment Check Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
