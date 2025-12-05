"use client";

import React from 'react';

interface AdminDebugPanelProps {
    isAdmin: boolean;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Debug panel that only renders for admin users
 * Used in CollectionsList and ListedNFTsList
 */
export const AdminDebugPanel = React.memo(({
    isAdmin,
    title = '🔍 Admin Debug Info',
    children,
    className = '',
}: AdminDebugPanelProps) => {
    if (!isAdmin) return null;

    return (
        <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
            <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
            <div className="text-xs font-mono space-y-1">
                {children}
            </div>
        </div>
    );
});

AdminDebugPanel.displayName = 'AdminDebugPanel';

export default AdminDebugPanel;
