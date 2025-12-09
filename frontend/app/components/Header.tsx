'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, X } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

export default function Header() {
    const [user, setUser] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Hydrate user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const getNavLinks = () => {
        if (!user) return [];

        const commonLinks = [

        ];

        if (user.role === 'SUPER_ADMIN') {
            return [
                { name: 'Dashboard', href: '/dashboard/superadmin' },
                { name: 'Inventory', href: '/dashboard/superadmin/inventory' },
                { name: 'Stores', href: '/dashboard/superadmin/stores' },
                { name: 'Sites', href: '/dashboard/superadmin/sites' },
                { name: 'Products', href: '/dashboard/superadmin/products' },
                // { name: 'Reports', href: '/dashboard/superadmin/reports' },
            ];
        }

        if (user.role === 'STORE_MANAGER') {
            return [
                { name: 'Dashboard', href: '/dashboard/store' },
                { name: 'My Products', href: '/dashboard/store/products' },
                // { name: 'Requests', href: '/dashboard/store/requests' },
            ];
        }

        if (user.role === 'SITE_ENGINEER') {
            return [
                { name: 'Dashboard', href: '/dashboard/site' },
                { name: 'My Products', href: '/dashboard/site/products' },
                // { name: 'Requests', href: '/dashboard/site/requests' },
            ];
        }

        return [];
    };

    const navLinks = getNavLinks();

    return (
        <header className="bg-white shadow-sm z-40 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Desktop Nav */}
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard/superadmin" className="text-2xl font-bold text-purple-600">
                                Wechecha
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === link.href
                                            ? 'border-purple-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </button>

                        {/* Profile Dropdown */}
                        <ProfileDropdown user={user} />

                        {/* Mobile Menu Button */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="sm:hidden bg-white border-t border-gray-200">
                    <div className="pt-2 pb-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${pathname === link.href
                                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
