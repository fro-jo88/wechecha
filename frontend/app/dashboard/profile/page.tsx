'use client';

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import Link from 'next/link';
import { User, Mail, Shield, MapPin } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await apiClient.auth.getMe();
            if (response.data) {
                setUser(response.data);
                // Update local storage to keep sync
                localStorage.setItem('user', JSON.stringify(response.data));
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    if (!user) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-purple-600 px-6 py-4">
                    <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-purple-600 text-2xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4 text-white">
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            <p className="text-purple-100">{user.role}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex items-start">
                            <User className="h-6 w-6 text-gray-400 mt-1" />
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                                <p className="mt-1 text-lg text-gray-900">{user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <Mail className="h-6 w-6 text-gray-400 mt-1" />
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                                <p className="mt-1 text-lg text-gray-900">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <Shield className="h-6 w-6 text-gray-400 mt-1" />
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        {user.location && (
                            <div className="flex items-start">
                                <MapPin className="h-6 w-6 text-gray-400 mt-1" />
                                <div className="ml-4">
                                    <h3 className="text-sm font-medium text-gray-500">Assigned Location</h3>
                                    <p className="mt-1 text-lg text-gray-900">{user.location.name} ({user.location.type})</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pt-6 flex space-x-4">
                        <Link
                            href="/dashboard/profile/edit"
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                        >
                            Edit Profile
                        </Link>
                        <Link
                            href="/dashboard/profile/security"
                            className="text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition"
                        >
                            Change Password
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
