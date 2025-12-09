'use client';

import { FileText, Package, Truck } from 'lucide-react';
import { useState } from 'react';

export default function ReportsPage() {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        mainCategory: ''
    });

    const downloadReport = async (type: string) => {
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.mainCategory) queryParams.append('mainCategory', filters.mainCategory);

            const res = await fetch(`http://localhost:3001/api/reports/${type}/pdf?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to download report');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download report');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">System Reports</h1>
                <p className="text-gray-600 mb-8">Generate and download PDF reports. You can filter by date and category.</p>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Main Category</label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            value={filters.mainCategory}
                            onChange={(e) => setFilters({ ...filters, mainCategory: e.target.value })}
                        >
                            <option value="">All Categories</option>
                            <option value="CONSUMABLE_GOODS">Consumable Goods</option>
                            <option value="FIXED_ASSETS">Fixed Assets</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Inventory Report */}
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center">
                        <div className="p-4 bg-blue-100 rounded-full mb-4">
                            <Package className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Full Inventory Report</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Complete list of inventory across all stores and sites with quantities.
                        </p>
                        <button
                            onClick={() => downloadReport('inventory')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition w-full"
                        >
                            Download PDF
                        </button>
                    </div>

                    {/* Product Catalog Report */}
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center">
                        <div className="p-4 bg-purple-100 rounded-full mb-4">
                            <FileText className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Product Catalog</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            List of all registered products, SKUs, and categories.
                        </p>
                        <button
                            onClick={() => downloadReport('products')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition w-full"
                        >
                            Download PDF
                        </button>
                    </div>

                    {/* Request History Report */}
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center text-center">
                        <div className="p-4 bg-orange-100 rounded-full mb-4">
                            <Truck className="h-8 w-8 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Request History</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Log of all inventory requests, assignments, and transfers.
                        </p>
                        <button
                            onClick={() => downloadReport('requests')}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition w-full"
                        >
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
