"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import RequestAssignmentModal from "../../components/RequestAssignmentModal";

export default function SiteEngineerDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== "SITE_ENGINEER") {
            router.push("/login");
            return;
        }

        setUser(parsedUser);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Site Engineer Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name}!</p>
            <p className="text-sm text-gray-500 mt-2">Location ID: {user?.locationId || "Not assigned"}</p>

            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 font-medium"
                    >
                        Request Materials
                    </button>
                </div>
                <ul className="space-y-2">
                    <li className="text-gray-600">• Request materials from store</li>
                    <li className="text-gray-600">• Report daily consumption</li>
                    <li className="text-gray-600">• View site inventory</li>
                </ul>
            </div>

            <RequestAssignmentModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSuccess={() => alert('Request submitted successfully!')}
            />
        </div>
    );
}
