/**
 * EmptyState Component
 * 
 * Standardized empty states across the application.
 * Eliminates duplicate empty state implementations.
 * 
 * Features:
 * - Icon/emoji display
 * - Title and description
 * - Optional action button
 * - Customizable styling
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon="🖼️"
 *   title="No NFTs Found"
 *   description="Try adjusting your filters"
 *   action={{ label: 'Clear Filters', onClick: clearFilters }}
 * />
 * ```
 */
'use client'
import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ===== TYPES =====

export interface EmptyStateProps {
    /** Icon/emoji to display */
    icon?: string | ReactNode;
    /** Main heading */
    title: string;
    /** Description text */
    description?: string;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional classes */
    className?: string;
}

// ===== SIZE CONFIGS =====

const sizeConfig = {
    sm: {
        container: 'py-8',
        icon: 'text-4xl mb-2',
        title: 'text-lg mb-1',
        description: 'text-sm',
        button: 'px-4 py-2 text-sm'
    },
    md: {
        container: 'py-12',
        icon: 'text-5xl mb-3',
        title: 'text-xl mb-2',
        description: 'text-base',
        button: 'px-5 py-2.5 text-base'
    },
    lg: {
        container: 'py-16',
        icon: 'text-6xl mb-4',
        title: 'text-2xl mb-3',
        description: 'text-lg',
        button: 'px-6 py-3 text-base'
    }
} as const;

// ===== MAIN COMPONENT =====

export const EmptyState = memo<EmptyStateProps>(({
    icon,
    title,
    description,
    action,
    size = 'md',
    className
}) => {
    const config = sizeConfig[size];
    const isEmojiIcon = typeof icon === 'string';

    return (
        <div className={cn(
            'flex flex-col items-center justify-center text-center',
            config.container,
            className
        )}>
            {/* Icon/Emoji */}
            {icon && (
                <div className={config.icon}>
                    {isEmojiIcon ? (
                        <span role="img" aria-hidden="true">{icon}</span>
                    ) : (
                        icon
                    )}
                </div>
            )}

            {/* Title */}
            <h3 className={cn(
                'font-bold text-gray-900',
                config.title
            )}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className={cn(
                    'text-gray-600 max-w-md',
                    config.description
                )}>
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className={cn(
                        'mt-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium',
                        config.button
                    )}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
});

EmptyState.displayName = 'EmptyState';

// ===== PRESET VARIANTS =====

/**
 * No NFTs found empty state
 */
export const NoNFTsFound = memo<{ onClearFilters?: () => void }>(({ onClearFilters }) => {
    return (
        <EmptyState
            icon="🖼️"
            title="No NFTs Found"
            description="No items match your current filters. Try adjusting your search criteria."
            action={onClearFilters ? {
                label: 'Clear Filters',
                onClick: onClearFilters
            } : undefined}
        />
    );
});

NoNFTsFound.displayName = 'NoNFTsFound';

/**
 * No results empty state
 */
export const NoResults = memo<{ query?: string }>(({ query }) => {
    return (
        <EmptyState
            icon="🔍"
            title="No Results Found"
            description={query ? `No results for "${query}". Try a different search term.` : 'Try a different search term.'}
        />
    );
});

NoResults.displayName = 'NoResults';

/**
 * Empty wallet state
 */
export const EmptyWallet = memo(() => {
    return (
        <EmptyState
            icon="👛"
            title="Your Wallet is Empty"
            description="You don't own any NFTs yet. Browse the marketplace to get started."
        />
    );
});

EmptyWallet.displayName = 'EmptyWallet';

/**
 * No listings state
 */
export const NoListings = memo(() => {
    return (
        <EmptyState
            icon="📝"
            title="No Active Listings"
            description="You don't have any NFTs listed for sale. Go to your wallet to create a listing."
        />
    );
});

NoListings.displayName = 'NoListings';

export default EmptyState;
