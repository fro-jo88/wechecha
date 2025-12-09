'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'SUPER_ADMIN') {
                // Redirect to their specific dashboard if they try to access superadmin area
                if (user.role === 'STORE_MANAGER') {
                    router.push('/dashboard/store');
                } else if (user.role === 'SITE_ENGINEER') {
                    router.push('/dashboard/site');
                } else {
                    router.push('/login');
                }
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // Double check to prevent flash of content
    if (!user || user.role !== 'SUPER_ADMIN') {
        return null;
    }

    return <>{children}</>;
}
