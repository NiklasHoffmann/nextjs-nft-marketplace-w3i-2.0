"use client";

import React from 'react';

interface CollectionCardHeaderProps {
    contractSymbol?: string;
    contractName?: string;
}

/**
 * Header section for collection cards
 * Shows contract symbol and name
 */
export const CollectionCardHeader = React.memo(({
    contractSymbol,
    contractName,
}: CollectionCardHeaderProps) => {
    return (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-lg truncate flex-1">
                    {contractSymbol || 'Unknown'}
                </h3>
            </div>
            <p
                className="text-sm text-gray-600 truncate"
                title={contractName || 'Unknown Collection'}
            >
                {contractName || 'Unknown Collection'}
            </p>
        </div>
    );
});

CollectionCardHeader.displayName = 'CollectionCardHeader';

export default CollectionCardHeader;
