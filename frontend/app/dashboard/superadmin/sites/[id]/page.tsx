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

export default function SiteInventoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [user, setUser] = useState<any>(null);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        const currentUser = apiClient.getCurrentUser();
        setUser(currentUser);
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            // Fetch Site Details including Inventory
            const response = await apiClient.sites.getById(parseInt(id));
            setSiteName(response.data.name);
            setStatus(response.data.status); // Assuming backend returns status
            setInventory(response.data.inventory || []);
        } catch (error: any) {
            console.error('Failed to fetch inventory:', error);
            if (error.status === 403) {
                alert("Access Denied: This site is finished.");
                // Redirect or handle appropriately
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFinishSite = async () => {
        if (!confirm("Are you sure you want to finish this site? It will be locked from further editing.")) return;

        try {
            await apiClient.sites.finish(parseInt(id));
            alert("Site finished successfully!");
            fetchInventory(); // Refresh to see status change
        } catch (error: any) {
            console.error("Failed to finish site:", error);
            alert(error.message || "Failed to finish site. Ensure inventory is empty.");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link href="/dashboard/superadmin/sites" className="text-blue-600 hover:underline mb-2 block">
                        ← Back to Sites
                    </Link>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-800">{siteName} Inventory</h1>
                        {status === 'COMPLETED' ? (
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">FINISHED</span>
                        ) : (
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">ACTIVE</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    {user?.role === 'SUPER_ADMIN' && status !== 'COMPLETED' && (
                        <button
                            onClick={handleFinishSite}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition"
                        >
                            Finish Site
                        </button>
                    )}
                    <DownloadPDFButton type="inventory" label="Export Inventory" />
                </div>
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
                                    No inventory found for this site.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
