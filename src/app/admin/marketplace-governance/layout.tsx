import type { ReactNode } from 'react';
import { MarketplaceGovernanceSidebar } from '@/app/admin/components/multisig/MarketplaceGovernanceSidebar';

interface MarketplaceGovernanceLayoutProps {
    children: ReactNode;
}

export default function MarketplaceGovernanceLayout({ children }: MarketplaceGovernanceLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <MarketplaceGovernanceSidebar />
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
