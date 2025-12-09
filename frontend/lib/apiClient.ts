// frontend/lib/apiClient.ts
/**
 * Centralized API Client with automatic security handling
 * - Automatic JWT token attachment
 * - Response error handling (401, 403)
 * - Location ID validation
 * - Redirect on unauthorized access
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Get the authentication token from localStorage
 */
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

/**
 * Get the current user from localStorage
 */
export function getCurrentUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Check if user has permission to access a specific location
 */
export function canAccessLocation(locationId: number): boolean {
    const user = getCurrentUser();
    if (!user) return false;

    // Super Admin can access all locations
    if (user.role === 'SUPER_ADMIN') return true;

    // Store Managers and Site Engineers can only access their assigned location
    if (user.role === 'STORE_MANAGER' || user.role === 'SITE_ENGINEER') {
        return user.locationId === locationId;
    }

    return false;
}

/**
 * Handle API errors - redirect to login on 401, show error on 403
 */
function handleApiError(status: number, data: any): never {
    if (status === 401) {
        // Unauthorized - clear auth and redirect to login
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

    if (status === 403) {
        // Forbidden - show error but don't redirect
        const message = data?.message || data?.error || 'Access denied';
        throw new ApiError(status, message, data);
    }

    // Other errors
    const message = data?.error || data?.message || 'An error occurred';
    throw new ApiError(status, message, data);
}

/**
 * Make an API request with automatic auth handling
 */
async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Clean URL construction to avoid double slashes
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const url = `${baseUrl}/${cleanEndpoint}`;

    try {
        console.log(`[API] Request: ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, {
            ...options,
            headers,
        });

        console.log(`[API] Response: ${response.status} ${response.statusText}`);

        // Try to parse JSON, but handle HTML responses gracefully
        let data;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            // Got HTML or other non-JSON response
            const text = await response.text();

            // Only treat as error if status is not OK
            if (!response.ok) {
                console.error(`[API] Non-JSON response (${contentType}):`, text.substring(0, 200));
                throw new ApiError(
                    response.status,
                    `Server returned ${contentType} instead of JSON. Status: ${response.status}`,
                    { contentType, preview: text.substring(0, 200) }
                );
            }
            // If OK but not JSON (e.g. 200 OK text), just return text? Usually API returns JSON.
        }

        if (!response.ok) {
            handleApiError(response.status, data);
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Detailed error logging for Fetch API (Standard Error)
        const isTypeError = error instanceof TypeError;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error('[API ERROR]', {
            message: errorMessage,
            url,
            method: options.method || 'GET',
            type: isTypeError ? 'Network/CORS/Offline' : 'Runtime Error',
            stack: errorStack
        });

        // Determine error type
        if (isTypeError) {
            throw new ApiError(
                0,
                `Network error: Cannot reach ${url}. Check your internet connection, backend URL (${baseUrl}), or CORS settings.`,
                { originalError: errorMessage, url }
            );
        }

        // Generic network error
        throw new ApiError(
            500,
            'Request failed',
            { originalError: errorMessage, url }
        );
    }
}

/**
 * API client methods for common operations
 */
export const apiClient = {
    // GET request
    get: <T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
        const queryString = params
            ? '?' + new URLSearchParams(params).toString()
            : '';
        return apiRequest<T>(`${endpoint}${queryString}`, {
            method: 'GET',
        });
    },

    // POST request
    post: <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // PUT request
    put: <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // DELETE request
    delete: <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, {
            method: 'DELETE',
        });
    },

    // Stores
    stores: {
        getAll: (params?: Record<string, any>) => apiClient.get('/stores', params),
        getById: (id: number) => apiClient.get(`/stores/${id}`),
        getInventory: (id: number) => apiClient.get(`/stores/${id}/inventory`),
        create: (data: any) => apiClient.post('/stores', data),
        update: (id: number, data: any) => apiClient.put(`/stores/${id}`, data),
        delete: (id: number) => apiClient.delete(`/stores/${id}`),
    },

    // Sites
    sites: {
        getAll: (params?: Record<string, any>) => apiClient.get('/sites', params),
        getById: (id: number) => apiClient.get(`/sites/${id}`),
        create: (data: any) => apiClient.post('/sites', data),
        update: (id: number, data: any) => apiClient.put(`/sites/${id}`, data),
        delete: (id: number) => apiClient.delete(`/sites/${id}`),
        finish: (id: number) => apiClient.post(`/sites/${id}/finish`),
    },

    // Inventory Requests
    requests: {
        getAll: (params?: Record<string, any>) => apiClient.get('/requests', params),
        getById: (id: number) => apiClient.get(`/requests/${id}`),
        getPending: () => apiClient.get('/requests/pending'),
        create: (data: any) => apiClient.post('/requests', data),
        approve: (id: number) => apiClient.put(`/requests/${id}/approve`),
        reject: (id: number) => apiClient.put(`/requests/${id}/reject`),
    },

    // Products
    products: {
        getAll: (params?: Record<string, any>) => apiClient.get('/products', params),
        getById: (id: number) => apiClient.get(`/products/${id}`),
        create: (data: any) => apiClient.post('/products', data),
        update: (id: number, data: any) => apiClient.put(`/products/${id}`, data),
        delete: (id: number) => apiClient.delete(`/products/${id}`),
        approve: (id: number) => apiClient.put(`/products/${id}/approve`),
        reject: (id: number) => apiClient.put(`/products/${id}/reject`),
    },

    // Assignments
    assignments: {
        getAll: () => apiClient.get('/assignments'),
        create: (data: any) => apiClient.post('/assignments', data),
        approve: (id: number) => apiClient.put(`/assignments/${id}/approve`),
        reject: (id: number) => apiClient.put(`/assignments/${id}/reject`),
    },

    // Notifications
    notifications: {
        getAll: () => apiClient.get('/notifications'),
        markAsRead: (id: number) => apiClient.put(`/notifications/${id}/read`),
        markAllAsRead: () => apiClient.put('/notifications/read-all'),
    },

    // Dashboard
    inventory: {
        adjust: (data: { inventoryId: number; quantity: number; reason?: string }) =>
            apiClient.post('/inventory/adjust', data),
        transfer: (data: { inventoryId: number; targetLocationId: number; quantity?: number; reason?: string }) =>
            apiClient.post('/inventory/transfer', data),
    },
    dashboard: {
        getSuperAdminStats: () => apiClient.get('/dashboard/stats'),
        getInventoryOverview: () => apiClient.get('/dashboard/inventory'),
        getFilteredInventory: (params?: Record<string, any>) =>
            apiClient.get('/dashboard/inventory/filter', params),
    },

    // Auth
    auth: {
        login: (email: string, password: string) =>
            apiClient.post('/auth/login', { email, password }),
        getMe: () => apiClient.get('/auth/me'),
        updateProfile: (data: any) => apiClient.put('/auth/update-profile', data),
        updatePassword: (currentPassword: string, newPassword: string) =>
            apiClient.put('/auth/update-password', { currentPassword, newPassword }),
    },
};

export default apiClient;
