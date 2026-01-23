'use client';

import { ReactNode } from 'react';

export default function NFTDetailLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-[66px]">
                {children}
            </main>
        </div>
    );
}
