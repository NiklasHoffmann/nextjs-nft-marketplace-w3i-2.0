import type { ReactNode } from 'react';
import { MultisigWalletSidebar } from '@/app/admin/components/multisig/MultisigWalletSidebar';

interface MultisigWalletLayoutProps {
    children: ReactNode;
}

export default function MultisigWalletLayout({ children }: MultisigWalletLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <MultisigWalletSidebar />
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
