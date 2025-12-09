// frontend/app/components/dashboard/SuperAdminDashboard.tsx
'use client';

import React, { useState } from 'react';

// Mock Data Types
type Site = {
    id: string;
    name: string;
    stockLevel: 'High' | 'Medium' | 'Low';
    inventoryValue: number;
    status: 'ACTIVE' | 'COMPLETED';
};

type Transfer = {
    id: string;
    from: string;
    to: string;
    item: string;
    quantity: number;
    time: string;
};

const SuperAdminDashboard: React.FC = () => {
    // Mock Data
    const [sites, setSites] = useState<Site[]>([
        { id: '1', name: 'Downtown Plaza', stockLevel: 'High', inventoryValue: 50000, status: 'ACTIVE' },
        { id: '2', name: 'Westside Mall', stockLevel: 'Low', inventoryValue: 12000, status: 'ACTIVE' },
        { id: '3', name: 'Harbor Bridge', stockLevel: 'Medium', inventoryValue: 35000, status: 'ACTIVE' },
    ]);

    const [transfers] = useState<Transfer[]>([
        { id: 't1', from: 'Central Store', to: 'Downtown Plaza', item: 'Bricks', quantity: 500, time: '5 mins ago' },
        { id: 't2', from: 'North Warehouse', to: 'Westside Mall', item: 'Cement', quantity: 100, time: '15 mins ago' },
        { id: 't3', from: 'Downtown Plaza', to: 'Central Store', item: 'Generators', quantity: 2, time: '1 hour ago' },
    ]);

    const handleFinishSite = async (siteId: string) => {
        // In a real app, this would call the API
        // const response = await fetch(`/api/sites/${siteId}/finish`, { method: 'POST' });

        // Simulating the check
        const site = sites.find(s => s.id === siteId);
        if (site && site.inventoryValue > 0) {
            alert(`ERROR: Cannot finish ${site.name}. Inventory value is $${site.inventoryValue}. Please transfer items first.`);
            return;
        }

        // Optimistic update
        setSites(sites.map(s => s.id === siteId ? { ...s, status: 'COMPLETED' } : s));
        alert(`Success: ${site?.name} marked as COMPLETED.`);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Super Admin Dashboard</h1>

            {/* Top Cards - The "Health" Check */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Active Sites</h3>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{sites.filter(s => s.status === 'ACTIVE').length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Warehouses</h3>
                    <p className="text-4xl font-bold text-indigo-600 mt-2">2</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Value on Hand</h3>
                    <p className="text-4xl font-bold text-green-600 mt-2">$1.5M</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Map/Grid View - Sites List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">Active Sites</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Site Name</th>
                                    <th className="px-6 py-4">Stock Level</th>
                                    <th className="px-6 py-4">Value</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sites.map((site) => (
                                    <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{site.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${site.stockLevel === 'High' ? 'bg-green-100 text-green-800' :
                                                    site.stockLevel === 'Low' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {site.stockLevel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">${site.inventoryValue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-600">{site.status}</td>
                                        <td className="px-6 py-4 text-right">
                                            {site.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleFinishSite(site.id)}
                                                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                                                >
                                                    Close Project
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Global Movements */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">Recent Movements</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {transfers.map((transfer) => (
                            <div key={transfer.id} className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {transfer.from} <span className="text-gray-400">→</span> {transfer.to}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Sent {transfer.quantity} {transfer.item}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{transfer.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SuperAdminDashboard;
