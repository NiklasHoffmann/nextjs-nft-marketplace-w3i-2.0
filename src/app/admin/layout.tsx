import { ReactNode } from 'react';
import AdminAuthGuard from '@/components/auth/AdminAuthGuard';

export const metadata = {
    title: 'Admin Panel',
    description: 'NFT Marketplace Admin Panel',
};

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <AdminAuthGuard>
            {children}
        </AdminAuthGuard>
    );
}
