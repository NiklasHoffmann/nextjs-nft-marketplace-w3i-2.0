"use client";

import React, { useState, useEffect } from 'react';
import { WalletDashboard } from '@/components/wallet';
import { LoadingState } from '@/components/core/Loading';

// Force dynamic rendering for this page to prevent SSG issues
export const dynamic = 'force-dynamic';

export default function WalletPage() {
    const [mounted, setMounted] = useState(false);

    // Only render after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                <LoadingState size="lg" variant="centered" message="Loading wallet dashboard..." />
            </div>
        );
    }

    return <WalletDashboard />;
}
