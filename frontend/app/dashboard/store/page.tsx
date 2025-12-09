"use client";

import { useProtectedPage } from "../../../hooks/useAuth";
import RequestAssignmentModal from "../../components/RequestAssignmentModal";
import { useState } from "react";

export default function StoreManagerDashboard() {
    const { user, loading } = useProtectedPage('STORE_MANAGER');
    const [showRequestModal, setShowRequestModal] = useState(false);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Store Manager Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}!</p>
            <p className="text-sm text-gray-500 mt-2">Location ID: {user.locationId || "Not assigned"}</p>

            {!user.locationId && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-medium">⚠️ No store assigned</p>
                    <p className="text-yellow-700 text-sm mt-1">
                        Please contact an administrator to assign you to a store.
                    </p>
                </div>
            )}

            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setShowRequestModal(true)}
                        disabled={!user.locationId}
                        className={`px-4 py-2 rounded font-medium ${user.locationId
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Request Inventory
                    </button>
                </div>
                <ul className="space-y-2">
                    <li className="text-gray-600">• Dispatch items to sites</li>
                    <li className="text-gray-600">• View store inventory</li>
                    <li className="text-gray-600">• Process transfer requests</li>
                </ul>
            </div>

            <RequestAssignmentModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSuccess={() => {
                    alert('Request submitted successfully!');
                    setShowRequestModal(false);
                }}
            />
        </div>
    );
}

