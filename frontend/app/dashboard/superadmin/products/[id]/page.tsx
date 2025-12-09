'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { ArrowLeft, Trash2, Edit, Package, Tag, DollarSign, Ruler } from 'lucide-react';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = apiClient.getCurrentUser();
        setUser(currentUser);
        fetchProduct();
    }, []);

    const fetchProduct = async () => {
        try {
            const response = await apiClient.products.getById(parseInt(id));
            setProduct(response.data);
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            await apiClient.products.delete(parseInt(id));
            alert('Product deleted successfully');
            router.push('/dashboard/superadmin/products');
        } catch (error: any) {
            console.error('Failed to delete product:', error);
            alert(error.message || 'Failed to delete product');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!product) return <div className="p-8 text-red-500">Product not found</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Link
                            href="/dashboard/superadmin/products"
                            className="text-gray-500 hover:text-gray-700 flex items-center mb-2 transition"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Products
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                        <div className="mt-2 flex gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {product.status}
                            </span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">
                                SKU: {product.sku}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {user?.role === 'SUPER_ADMIN' && (
                            <>
                                {/* Delete Button */}
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 border border-red-200 transition"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Product
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

                        {/* Left Column: Key Details */}
                        <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Product Details</h2>

                            <div className="flex items-start">
                                <Package className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Main Category</p>
                                    <p className="text-base text-gray-900">{product.mainCategory?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Tag className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Sub-Category</p>
                                    <p className="text-base text-gray-900">{product.category}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Price</p>
                                    <p className="text-base text-gray-900 font-mono">{product.price?.toLocaleString()} ETB</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Ruler className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Unit of Measurement</p>
                                    <p className="text-base text-gray-900">{product.unit}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Inventory & Meta */}
                        <div className="p-6 space-y-6 bg-gray-50/50">
                            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Stock Information</h2>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Minimum Stock Alert Level</p>
                                <div className="text-2xl font-bold text-gray-800">{product.defaultMinStock} <span className="text-sm font-normal text-gray-500">{product.unit}</span></div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Current Global Stock</p>
                                <div className="text-2xl font-bold text-blue-600">
                                    {/* Calculate sum of inventory if available, otherwise fetch */}
                                    {product.inventory?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0}
                                    <span className="text-sm font-normal text-gray-500 ml-1">{product.unit}</span>
                                </div>
                            </div>

                            {product.description && (
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                                    <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
                        <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
                        <span>Last Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
