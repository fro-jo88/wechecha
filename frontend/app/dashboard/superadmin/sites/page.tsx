'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from "@/lib/apiClient";

interface Site {
    id: number;
    name: string;
    region: string;
    status: string;
    engineer?: {
        name: string;
    };
}

export default function SitesPage() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const response = await apiClient.sites.getAll();
            setSites(response.data || []);
        } catch (error) {
            console.error('Failed to fetch sites:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Sites</h1>
                <Link href="/dashboard/superadmin/sites/add" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    + Add Site
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engineer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sites.map((site) => (
                            <tr key={site.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/dashboard/superadmin/sites/${site.id}`} className="text-blue-600 hover:underline font-medium">
                                        {site.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{site.region || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{site.engineer?.name || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${site.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {site.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
