'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useProtectedPage } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle, XCircle, Package } from 'lucide-react';
import ProductDetailsModal from '@/app/components/ProductDetailsModal';

export default function SiteProductsPage() {
    const { user, loading: authLoading } = useProtectedPage(['SITE_ENGINEER']);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

    useEffect(() => {
        if (user) {
            fetchProducts();
        }
    }, [user, activeTab]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let status;
            if (activeTab === 'pending') {
                status = 'PENDING_APPROVAL';
            }
            const response = await apiClient.products.getAll(status ? { status } : {});
            setProducts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await apiClient.products.approve(id);
            fetchProducts();
        } catch (error: any) {
            console.error('Failed to approve:', error);
            alert('Failed to approve product');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Reject this product?')) return;
        try {
            await apiClient.products.reject(id);
            fetchProducts();
        } catch (error: any) {
            console.error('Failed to reject:', error);
            alert('Failed to reject product');
        }
    };

    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (product: any) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <ProductDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
            />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Site Products</h1>
                    <p className="text-gray-500 mt-1">Manage inventory and view products for your site</p>
                </div>
                <Link href="/dashboard/superadmin/products/add" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium flex items-center">
                    + Request/Add Product
                </Link>
            </div>

            <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'all'
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    My Inventory
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center ${activeTab === 'pending'
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Pending Approval
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Package className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="font-medium text-gray-900">{product.name}</div>
                                            <div className="text-sm text-gray-500">{product.unit}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{product.category}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {product.sku}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'APPROVED' || product.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-800'
                                        : product.status === 'PENDING_APPROVAL'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {product.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleViewDetails(product)}
                                        className="text-purple-600 hover:text-purple-900 font-medium"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    {activeTab === 'pending' ? 'No products pending approval.' : 'No products found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
