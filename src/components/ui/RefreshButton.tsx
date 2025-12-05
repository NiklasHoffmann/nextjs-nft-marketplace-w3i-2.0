"use client";

import React from 'react';
import { RefreshIcon, SpinnerIcon } from '@/components/icons';

interface RefreshButtonProps {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    label?: string;
    loadingLabel?: string;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Reusable Refresh Button with loading state
 * Used in CollectionsList and ListedNFTsList
 */
export const RefreshButton = React.memo(({
    onClick,
    loading = false,
    disabled = false,
    label = 'Refresh',
    loadingLabel = 'Refreshing...',
    variant = 'primary',
    size = 'md',
    className = '',
}: RefreshButtonProps) => {
    const baseStyles = 'flex items-center gap-2 rounded-lg transition-all duration-300 font-medium';

    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 shadow-sm hover:shadow-md',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            title="Refresh data"
        >
            {loading ? (
                <>
                    <SpinnerIcon className="w-4 h-4" />
                    {loadingLabel}
                </>
            ) : (
                <>
                    <RefreshIcon className="w-4 h-4" />
                    {label}
                </>
            )}
        </button>
    );
});

RefreshButton.displayName = 'RefreshButton';

export default RefreshButton;
