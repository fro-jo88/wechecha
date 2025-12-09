'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    name: string;
    email: string;
}

export default function AddStorePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        region: '',
        address: '',
        description: '',
        managerId: '' as string,
    });

    // New Manager Form State
    const [showNewManagerModal, setShowNewManagerModal] = useState(false);
    const [newManagerData, setNewManagerData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [managers, setManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            // Assuming we have an endpoint to get unassigned managers or all managers
            // For now, we might need to add this endpoint or filter users manually if list is small
            // Ideally: GET /api/users?role=STORE_MANAGER&assigned=false
            // We'll skip fetching for now if that endpoint doesn't exist, or just fetch all users if we have that endpoint
            // Let's assume we can rely on creating new ones for this feature request mainly.
            setPageLoading(false);
        } catch (error) {
            console.error('Failed to fetch managers', error);
            setPageLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const payload: any = { ...formData };
            if (payload.managerId === '') delete payload.managerId;

            // If we have a new manager to create
            if (newManagerData.email && newManagerData.password) {
                payload.newManager = newManagerData;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/stores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create store');
            }

            router.push('/dashboard/superadmin/stores');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
                <h1 className="text-2xl font-bold mb-6">Add New Store</h1>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Store Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Region</label>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Admin Assignment Section */}
                    <div className="border-t pt-4 mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Manager</label>

                        {newManagerData.email ? (
                            <div className="bg-green-50 border border-green-200 p-3 rounded flex justify-between items-center mb-2">
                                <div>
                                    <div className="font-semibold text-green-800">{newManagerData.name}</div>
                                    <div className="text-sm text-green-600 ">{newManagerData.email}</div>
                                    <div className="text-xs text-green-600 mt-1">Will be created and assigned</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNewManagerData({ name: '', email: '', password: '' })}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Placeholder for dropdown if we fetch existing users */}
                                <select
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                                    disabled={true}
                                >
                                    <option>Select Existing Manager (Coming Soon)</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setShowNewManagerModal(true)}
                                    className="w-full bg-indigo-50 text-indigo-700 py-2 px-4 rounded border border-indigo-200 hover:bg-indigo-100 transition"
                                >
                                    + Create New Store Manager
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 mt-6"
                    >
                        {loading ? 'Creating...' : 'Create Store'}
                    </button>
                </form>

                {/* Create User Modal */}
                {showNewManagerModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Create New Store Manager</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newManagerData.name}
                                        onChange={(e) => setNewManagerData({ ...newManagerData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newManagerData.email}
                                        onChange={(e) => setNewManagerData({ ...newManagerData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newManagerData.password}
                                        onChange={(e) => setNewManagerData({ ...newManagerData, password: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewManagerModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!newManagerData.email || !newManagerData.password}
                                        onClick={() => setShowNewManagerModal(false)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Confirm & Assign
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
