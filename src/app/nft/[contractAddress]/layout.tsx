import React from 'react';

export default function CollectionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-[66px]">
                {children}
            </main>
        </div>
    );
}
