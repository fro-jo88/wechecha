'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '../../../../lib/apiClient';
import DownloadPDFButton from '../../../components/DownloadPDFButton';
import { Trash2, Edit } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    sku: string;
    category: string;
    mainCategory: string;
    unit: string;
    price: number;
    status: string;
    defaultMinStock: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await apiClient.products.getAll();
            setProducts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            await apiClient.products.delete(id);
            // Refresh list
            fetchProducts();
        } catch (error: any) {
            console.error('Failed to delete product:', error);
            alert(error.message || 'Failed to delete product');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Products</h1>
                    <p className="text-gray-500 mt-1">Manage global product catalog</p>
                </div>
                <div className="flex space-x-3">
                    <DownloadPDFButton type="products" label="Export Catalog" />
                    <Link href="/dashboard/superadmin/products/add" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium flex items-center">
                        + Add Product
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div>
                                            <Link href={`/dashboard/superadmin/products/${product.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline">
                                                {product.name}
                                            </Link>
                                            <div className="text-sm text-gray-500">{product.price.toLocaleString()} ETB / {product.unit}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{product.category}</div>
                                    <div className="text-xs text-gray-500">{product.mainCategory.replace('_', ' ')}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {product.sku}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Min: {product.defaultMinStock}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {product.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {product.status !== 'INACTIVE' && (
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-red-600 hover:text-red-900 ml-4"
                                            title="Delete (Deactivate)"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No products found. Click "Add Product" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
