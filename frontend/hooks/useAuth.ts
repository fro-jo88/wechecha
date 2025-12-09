// frontend/hooks/useAuth.ts
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, canAccessLocation, ApiError } from '../lib/apiClient';

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'STORE_MANAGER' | 'SITE_ENGINEER';
    locationId?: number;
}

export function useAuth(requiredRole?: string | string[]) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // FIX: Stabilize requiredRole for dependency array
    // Convert to string so array reference changes don't trigger infinite loops
    const requiredRoleKey = useMemo(() => {
        if (!requiredRole) return '';
        return Array.isArray(requiredRole) ? requiredRole.sort().join(',') : requiredRole;
    }, [requiredRole]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);

            // Check role requirements
            if (requiredRole) {
                const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
                if (!roles.includes(parsedUser.role)) {
                    setError('Access denied: Insufficient permissions');
                    router.push('/login');
                    return;
                }
            }

            setUser(parsedUser);
        } catch (err) {
            console.error('Error parsing user data:', err);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router, requiredRoleKey]); // Use stable key instead of requiredRole

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const validateLocationAccess = (locationId: number): boolean => {
        return canAccessLocation(locationId);
    };

    const handleApiError = (error: any) => {
        if (error instanceof ApiError) {
            if (error.status === 403) {
                setError(error.message);
                return;
            }
            if (error.status === 401) {
                logout();
                return;
            }
        }
        setError(error.message || 'An error occurred');
    };

    return {
        user,
        loading,
        error,
        logout,
        validateLocationAccess,
        handleApiError,
        setError,
    };
}

/**
 * Hook to protect pages from unauthorized access
 */
export function useProtectedPage(allowedRoles?: string | string[]) {
    const { user, loading } = useAuth(allowedRoles);

    if (loading) {
        return { user: null, loading: true };
    }

    return { user, loading: false };
}

/**
 * Hook to validate URL parameter matches user's location
 */
export function useLocationValidation(locationId: number | string | undefined) {
    const { user, validateLocationAccess, handleApiError } = useAuth();
    const [isValid, setIsValid] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!user || !locationId) {
            setChecking(false);
            return;
        }

        const id = typeof locationId === 'string' ? parseInt(locationId) : locationId;

        if (isNaN(id)) {
            handleApiError(new ApiError(400, 'Invalid location ID'));
            setChecking(false);
            return;
        }

        const valid = validateLocationAccess(id);
        setIsValid(valid);

        if (!valid && user.role !== 'SUPER_ADMIN') {
            handleApiError(new ApiError(403, 'Access denied: You do not have permission to access this location'));
        }

        setChecking(false);
    }, [user, locationId]);

    return { isValid, checking };
}
