'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useProtectedPage } from '@/hooks/useAuth';
import apiClient, { ApiError } from '@/lib/apiClient';

// Zod Schema for Product
const productSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(100),
    sku: z.string().min(1, 'SKU is required').max(50),
    mainCategory: z.enum(['CONSUMABLE_GOODS', 'FIXED_ASSETS']),
    category: z.string().min(1, 'Category is required'),
    unit: z.string().min(1, 'Unit is required'),
    price: z.coerce.number().min(0, 'Price must be positive'),
    defaultMinStock: z.coerce.number().int().min(0, 'Min stock must be non-negative'),
    description: z.string().optional(),
    // locationId is required - will be auto-filled for Store Managers
    locationId: z.coerce.number().int().positive('Store selection is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Store {
    id: number;
    name: string;
    type: string;
}

export default function AddProductPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useProtectedPage(['SUPER_ADMIN', 'STORE_MANAGER']);

    const [stores, setStores] = useState<Store[]>([]);
    const [loadingStores, setLoadingStores] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            mainCategory: 'CONSUMABLE_GOODS',
            unit: 'piece',
            defaultMinStock: 10,
        },
    });

    // Fetch stores for Super Admin
    useEffect(() => {
        if (!authLoading && user?.role === 'SUPER_ADMIN') {
            fetchStores();
        }
    }, [authLoading, user]);

    // Auto-fill locationId for Store Manager
    useEffect(() => {
        if (!authLoading && user?.role === 'STORE_MANAGER' && user.locationId) {
            setValue('locationId', user.locationId);
        }
    }, [authLoading, user, setValue]);

    const fetchStores = async () => {
        try {
            setLoadingStores(true);
            const response = await apiClient.stores.getAll();
            // Filter to only show STORE type locations
            const storeLocations = (response.data || []).filter((loc: any) => loc.type === 'STORE');
            setStores(storeLocations);
        } catch (err) {
            console.error('Failed to fetch stores:', err);
            setSubmitError('Failed to load stores. Please refresh the page.');
        } finally {
            setLoadingStores(false);
        }
    };

    const onSubmit = async (data: ProductFormData) => {
        try {
            setSubmitError(null);
            setSubmitSuccess(false);

            await apiClient.products.create(data);

            setSubmitSuccess(true);
            toast.success('Product created successfully');

            // Redirect after short delay
            setTimeout(() => {
                router.push('/dashboard/superadmin/products');
            }, 1000);

        } catch (error: any) {
            console.error('Failed to create product:', error);
            setSubmitError(error.message || 'Failed to create product');
            toast.error(error.message || 'Failed to create product');
        }
    };

    if (!user) {
        return null; // Will redirect to login
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isStoreManager = user.role === 'STORE_MANAGER';

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isSuperAdmin && 'Create a product for any store'}
                        {isStoreManager && `Creating product for your store (ID: ${user.locationId})`}
                    </p>
                </div>

                {/* Success Message */}
                {submitSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4">
                        ✅ Product created successfully! Redirecting...
                    </div>
                )}

                {/* Error Message */}
                {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                        ⚠️ {submitError}
                    </div>
                )}

                {/* Store Manager Info Banner */}
                {isStoreManager && !user.locationId && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4">
                        ⚠️ No store assigned to your account. Contact an administrator.
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Store Selection - SUPER_ADMIN ONLY */}
                    {isSuperAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Store <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('locationId')}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                                disabled={loadingStores}
                            >
                                <option value="">
                                    {loadingStores ? 'Loading stores...' : 'Select a store'}
                                </option>
                                {stores.map((store) => (
                                    <option key={store.id} value={store.id}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                            {errors.locationId && (
                                <p className="mt-1 text-sm text-red-600">{errors.locationId.message}</p>
                            )}
                        </div>
                    )}

                    {/* Store Manager - Hidden Field */}
                    {isStoreManager && (
                        <input type="hidden" {...register('locationId')} />
                    )}

                    {/* Product Name & SKU */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('name')}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g. Cement 50kg"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('sku')}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g. CEM-50-001"
                            />
                            {errors.sku && (
                                <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Main Category & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Main Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('mainCategory')}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="CONSUMABLE_GOODS">Consumable Goods</option>
                                <option value="FIXED_ASSETS">Fixed Assets</option>
                            </select>
                            {errors.mainCategory && (
                                <p className="mt-1 text-sm text-red-600">{errors.mainCategory.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('category')}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="">Select Category</option>
                                <option value="Construction Material">Construction Material</option>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Tools">Tools</option>
                                <option value="Finishing">Finishing</option>
                                <option value="Safety Equipment">Safety Equipment</option>
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Unit & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('unit')}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g. kg, pcs, m"
                            />
                            {errors.unit && (
                                <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (ETB) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('price')}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="0.00"
                            />
                            {errors.price && (
                                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Min Stock */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Minimum Stock Level <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            {...register('defaultMinStock')}
                            className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="10"
                        />
                        {errors.defaultMinStock && (
                            <p className="mt-1 text-sm text-red-600">{errors.defaultMinStock.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Alert when stock falls below this level
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Optional product description..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-300 font-medium transition"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (isStoreManager && !user.locationId)}
                            className="flex-1 bg-purple-600 text-white py-2.5 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </span>
                            ) : (
                                'Create Product'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
