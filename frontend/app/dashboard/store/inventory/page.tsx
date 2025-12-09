'use client';

import { useState, useEffect } from 'react';
import apiClient from "@/lib/apiClient";
import InventoryTable from '@/app/components/InventoryTable';
import { useProtectedPage } from '@/hooks/useAuth';

export default function StoreInventoryPage() {
    const { user } = useProtectedPage(['STORE_MANAGER']);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchInventory();
        }
    }, [user]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            // Fetch filtered inventory for this store
            // The logic implies fetching general inventory overview but filtered by RBAC server-side
            // OR passing storeId explicitly.
            // dashboard.getInventoryOverview() handles auto-RBAC on backend (if I implemented that properly in dashboardController).
            // Let's verify dashboardController.getInventoryOverview -> uses buildLocationScopedWhere. Yes.

            const response = await apiClient.dashboard.getInventoryOverview();
            if (response.data) {
                setInventory(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Store Inventory</h1>
                </div>
                <InventoryTable inventory={inventory} role="STORE_MANAGER" refreshInventory={fetchInventory} />
            </div>
        </div>
    );
}
