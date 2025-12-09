'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings, Lock, Edit, Mail } from 'lucide-react';

interface ProfileDropdownProps {
    user: any;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 focus:outline-none"
            >
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                        href="/dashboard/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        <User className="mr-3 h-4 w-4" />
                        View Profile
                    </Link>

                    <Link
                        href="/dashboard/profile/edit"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        <Edit className="mr-3 h-4 w-4" />
                        Edit Profile
                    </Link>

                    <Link
                        href="/dashboard/profile/security"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        <Lock className="mr-3 h-4 w-4" />
                        Change Password
                    </Link>

                    <div className="border-t border-gray-100 mt-1">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
