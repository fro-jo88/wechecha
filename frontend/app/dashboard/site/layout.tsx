'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SiteLayout({
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
            } else if (user.role !== 'SITE_ENGINEER') {
                // Redirect logic
                if (user.role === 'SUPER_ADMIN') {
                    router.push('/dashboard/superadmin');
                } else if (user.role === 'STORE_MANAGER') {
                    router.push('/dashboard/store');
                } else {
                    router.push('/login');
                }
            }
        }
    }, [user, loading, router]);

    if (loading) return <div className="p-8">Loading...</div>;

    if (!user || user.role !== 'SITE_ENGINEER') return null;

    return <>{children}</>;
}
