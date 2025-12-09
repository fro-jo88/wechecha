'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'SUPER_ADMIN') {
                router.push('/dashboard/superadmin');
            } else if (user.role === 'STORE_MANAGER') {
                router.push('/dashboard/store');
            } else if (user.role === 'SITE_ENGINEER') {
                router.push('/dashboard/site');
            } else {
                router.push('/login');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-gray-500">Redirecting to your dashboard...</div>
        </div>
    );
}
