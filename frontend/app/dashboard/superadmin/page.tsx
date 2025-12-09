'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from "@/lib/apiClient";

interface Stats {
    totalStores: number;
    totalSites: number;
    totalProducts: number;
    totalInventoryRecords: number;
    totalInventoryQuantity: number;
    pendingRequests: number;
}

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await apiClient.dashboard.getSuperAdminStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
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
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Super Admin Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-sm text-gray-600 mb-2">Total Stores</div>
                        <div className="text-3xl font-bold text-blue-600">{stats?.totalStores || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-sm text-gray-600 mb-2">Total Sites</div>
                        <div className="text-3xl font-bold text-green-600">{stats?.totalSites || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-sm text-gray-600 mb-2">Total Products</div>
                        <div className="text-3xl font-bold text-purple-600">{stats?.totalProducts || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-sm text-gray-600 mb-2">Pending Requests</div>
                        <div className="text-3xl font-bold text-orange-600">{stats?.pendingRequests || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-sm text-gray-600 mb-2">Inventory Records</div>
                        <div className="text-3xl font-bold text-indigo-600">{stats?.totalInventoryRecords || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-sm text-gray-600 mb-2">Total Items</div>
                        <div className="text-3xl font-bold text-teal-600">{stats?.totalInventoryQuantity || 0}</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/dashboard/superadmin/stores/add" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-center font-semibold transition">
                            + Add Store
                        </Link>
                        <Link href="/dashboard/superadmin/sites/add" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-center font-semibold transition">
                            + Add Site
                        </Link>
                        <Link href="/dashboard/superadmin/products/add" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-center font-semibold transition">
                            + Add Product
                        </Link>
                        <Link href="/dashboard/superadmin/assign" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-center font-semibold transition">
                            Assign Product
                        </Link>
                    </div>
                </div>

                {/* Management Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/dashboard/superadmin/stores" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <h3 className="text-xl font-bold mb-2 text-blue-600">Manage Stores</h3>
                        <p className="text-gray-600">View, add, and manage all warehouse stores</p>
                    </Link>
                    <Link href="/dashboard/superadmin/sites" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <h3 className="text-xl font-bold mb-2 text-green-600">Manage Sites</h3>
                        <p className="text-gray-600">View, add, and manage construction sites</p>
                    </Link>
                    <Link href="/dashboard/superadmin/products" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <h3 className="text-xl font-bold mb-2 text-purple-600">Manage Products</h3>
                        <p className="text-gray-600">View product catalog and add new items</p>
                    </Link>
                    <Link href="/dashboard/superadmin/requests" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <h3 className="text-xl font-bold mb-2 text-orange-600">Requests</h3>
                        <p className="text-gray-600">View all inventory requests and their status</p>
                    </Link>
                    <Link href="/dashboard/superadmin/inventory" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <h3 className="text-xl font-bold mb-2 text-indigo-600">Inventory Overview</h3>
                        <p className="text-gray-600">View inventory across all locations</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
