"use client";

import React, { useState, useEffect } from 'react';
import { WalletDashboard } from './components';

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
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading wallet dashboard...</p>
                </div>
            </div>
        );
    }

    return <WalletDashboard />;
}
