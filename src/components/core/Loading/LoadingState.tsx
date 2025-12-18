/**
 * LoadingState Component
 * 
 * Standardized loading states across the application.
 * Eliminates ~20+ duplicate loading spinner implementations.
 * 
 * Features:
 * - Size variants (xs, sm, md, lg, xl)
 * - Layout variants (inline, centered, fullscreen)
 * - Optional message
 * - Consistent animation
 * 
 * @example
 * ```tsx
 * <LoadingState size="md" message="Loading NFTs..." />
 * <LoadingState variant="fullscreen" />
 * <LoadingState size="sm" variant="inline" />
 * ```
 */
'use client'
import { memo } from 'react';
import { cn } from '@/lib/utils';

// ===== TYPES =====

export interface LoadingStateProps {
    /** Spinner size */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Layout variant */
    variant?: 'inline' | 'centered' | 'fullscreen';
    /** Optional loading message */
    message?: string;
    /** Custom spinner color */
    color?: 'blue' | 'gray' | 'white';
    /** Additional classes */
    className?: string;
}

// ===== SIZE CONFIGS =====

const sizeConfig = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
    xl: 'h-16 w-16 border-4'
} as const;

const colorConfig = {
    blue: 'border-gray-300 border-t-blue-600',
    gray: 'border-gray-200 border-t-gray-600',
    white: 'border-white/30 border-t-white'
} as const;

// ===== SPINNER COMPONENT =====

const Spinner = memo<{ size: LoadingStateProps['size']; color: LoadingStateProps['color'] }>(({
    size = 'md',
    color = 'blue'
}) => {
    return (
        <div
            className={cn(
                'animate-spin rounded-full',
                sizeConfig[size],
                colorConfig[color]
            )}
            role="status"
            aria-label="Loading"
        />
    );
});

Spinner.displayName = 'Spinner';

// ===== MAIN COMPONENT =====

export const LoadingState = memo<LoadingStateProps>(({
    size = 'md',
    variant = 'centered',
    message,
    color = 'blue',
    className
}) => {
    // Inline variant (no wrapper, just spinner)
    if (variant === 'inline') {
        return <Spinner size={size} color={color} />;
    }

    // Centered variant (flex center, min height)
    if (variant === 'centered') {
        return (
            <div className={cn(
                'flex flex-col items-center justify-center gap-4 py-12',
                className
            )}>
                <Spinner size={size} color={color} />
                {message && (
                    <p className="text-sm text-gray-600 animate-pulse">
                        {message}
                    </p>
                )}
            </div>
        );
    }

    // Fullscreen variant (fixed overlay)
    return (
        <div className={cn(
            'fixed inset-0 bg-white/90 backdrop-blur-sm z-50',
            'flex flex-col items-center justify-center gap-4',
            className
        )}>
            <Spinner size={size} color={color} />
            {message && (
                <p className="text-sm text-gray-600 animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
});

LoadingState.displayName = 'LoadingState';

// ===== UTILITY COMPONENTS =====

/**
 * Inline spinner for buttons
 */
export const ButtonSpinner = memo<{ className?: string }>(({ className }) => {
    return (
        <svg
            className={cn('animate-spin h-4 w-4', className)}
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
});

ButtonSpinner.displayName = 'ButtonSpinner';

/**
 * Page-level loading skeleton
 */
export const PageLoader = memo<{ message?: string }>(({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
            <div className="text-center">
                <Spinner size="lg" color="blue" />
                <p className="text-gray-600 mt-4">{message}</p>
            </div>
        </div>
    );
});

PageLoader.displayName = 'PageLoader';

export default LoadingState;
