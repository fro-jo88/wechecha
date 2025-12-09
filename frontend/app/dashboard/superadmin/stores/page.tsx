'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient, { ApiError } from '../../../../lib/apiClient';
import { useProtectedPage } from '../../../../hooks/useAuth';

interface Store {
    id: number;
    name: string;
    region: string;
    status: string;
    manager?: {
        name: string;
    };
}

export default function StoresPage() {
    const { user, loading: authLoading } = useProtectedPage(['SUPER_ADMIN', 'STORE_MANAGER']);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user) {
            fetchStores();
        }
    }, [authLoading, user]);

    const fetchStores = async () => {
        try {
            setError(null);
            const response = await apiClient.stores.getAll();
            setStores(response.data || []);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to fetch stores');
            }
            console.error('Failed to fetch stores:', err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">⚠️ Error</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Stores</h1>
                {user?.role === 'SUPER_ADMIN' && (
                    <Link href="/dashboard/superadmin/stores/add" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        + Add Store
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stores.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    No stores found
                                </td>
                            </tr>
                        ) : (
                            stores.map((store) => (
                                <tr key={store.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/dashboard/superadmin/stores/${store.id}`} className="text-blue-600 hover:underline font-medium">
                                            {store.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{store.region || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{store.manager?.name || 'Unassigned'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${store.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {store.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
