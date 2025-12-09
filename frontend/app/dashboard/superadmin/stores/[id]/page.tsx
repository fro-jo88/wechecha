'use client';

import { use, useEffect, useState } from 'react';
import apiClient from "@/lib/apiClient";
import Link from 'next/link';
import DownloadPDFButton from '../../../../components/DownloadPDFButton';

interface InventoryItem {
    id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        sku: string;
        unit: string;
        category: string;
    };
}

export default function StoreInventoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [storeName, setStoreName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            // Fetch Store Details
            const storeRes = await apiClient.stores.getById(parseInt(id));
            setStoreName(storeRes.data.name);

            // Fetch Inventory
            const invRes = await apiClient.stores.getInventory(parseInt(id));
            setInventory(invRes.data || []);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link href="/dashboard/superadmin/stores" className="text-blue-600 hover:underline mb-2 block">
                        ← Back to Stores
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">{storeName} Inventory</h1>
                </div>
                <DownloadPDFButton type="inventory" label="Export Inventory" />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.length > 0 ? (
                            inventory.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-lg font-bold text-blue-600">
                                            {item.quantity} {item.product.unit}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No inventory found for this store.
                                    <div className="mt-2">
                                        <Link href="/dashboard/superadmin/requests/create" className="text-blue-600 hover:underline">
                                            Create a request
                                        </Link> to add stock.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
