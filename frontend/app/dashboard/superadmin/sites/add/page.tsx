'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';

export default function AddSitePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        region: '',
        address: '',
        description: '',
        status: 'ACTIVE',
        engineerId: '' as string,
    });

    // New Engineer Form State
    const [showNewEngineerModal, setShowNewEngineerModal] = useState(false);
    const [newEngineerData, setNewEngineerData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let siteData = { ...formData };

            // If we have new engineer data, create the engineer first
            if (newEngineerData.email && newEngineerData.password) {
                const engineerResponse = await apiClient.post('/auth/register', {
                    ...newEngineerData,
                    role: 'SITE_ENGINEER'
                });
                siteData.engineerId = engineerResponse.data.user.id.toString();
            }

            // Create the site
            await apiClient.post('/sites', siteData);
            router.push('/dashboard/superadmin/sites');
        } catch (err: any) {
            console.error('Site creation error:', err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create site';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
                <h1 className="text-2xl font-bold mb-6">Add New Site</h1>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Site Name</label>
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>

                    {/* Admin Assignment Section */}
                    <div className="border-t pt-4 mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Site Engineer</label>

                        {newEngineerData.email ? (
                            <div className="bg-green-50 border border-green-200 p-3 rounded flex justify-between items-center mb-2">
                                <div>
                                    <div className="font-semibold text-green-800">{newEngineerData.name}</div>
                                    <div className="text-sm text-green-600 ">{newEngineerData.email}</div>
                                    <div className="text-xs text-green-600 mt-1">Will be created and assigned</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNewEngineerData({ name: '', email: '', password: '' })}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <select
                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                                    disabled={true}
                                >
                                    <option>Select Existing Engineer (Coming Soon)</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setShowNewEngineerModal(true)}
                                    className="w-full bg-indigo-50 text-indigo-700 py-2 px-4 rounded border border-indigo-200 hover:bg-indigo-100 transition"
                                >
                                    + Create New Site Engineer
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Site'}
                    </button>
                </form>

                {/* Create User Modal */}
                {showNewEngineerModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Create New Site Engineer</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newEngineerData.name}
                                        onChange={(e) => setNewEngineerData({ ...newEngineerData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newEngineerData.email}
                                        onChange={(e) => setNewEngineerData({ ...newEngineerData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newEngineerData.password}
                                        onChange={(e) => setNewEngineerData({ ...newEngineerData, password: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewEngineerModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!newEngineerData.email || !newEngineerData.password}
                                        onClick={() => setShowNewEngineerModal(false)}
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
