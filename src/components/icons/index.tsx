"use client";

import React from 'react';

interface IconProps {
    className?: string;
    size?: number;
    filled?: boolean;
}

// Heart Icon - for likes
export const HeartIcon = React.memo(({ className = "w-4 h-4", size, filled = true }: IconProps) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    if (filled) {
        return (
            <svg className={sizeClass} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        );
    }

    return (
        <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
});
HeartIcon.displayName = 'HeartIcon';

// Eye Icon - for views
export const EyeIcon = React.memo(({ className = "w-4 h-4", size }: IconProps) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    return (
        <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
});
EyeIcon.displayName = 'EyeIcon';

// Bookmark Icon - for watchlist
export const BookmarkIcon = React.memo(({ className = "w-4 h-4", size, filled = false }: IconProps) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    if (filled) {
        return (
            <svg className={sizeClass} fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        );
    }

    return (
        <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
    );
});
BookmarkIcon.displayName = 'BookmarkIcon';

// Star Icon - for ratings
export const StarIcon = React.memo(({ className = "w-4 h-4", size, filled = true }: IconProps) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    if (filled) {
        return (
            <svg className={sizeClass} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
        );
    }

    return (
        <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    );
});
StarIcon.displayName = 'StarIcon';

// Refresh Icon - for refresh buttons
export const RefreshIcon = React.memo(({ className = "w-4 h-4", size, spinning = false }: IconProps & { spinning?: boolean }) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    return (
        <svg
            className={`${sizeClass} ${spinning ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
        </svg>
    );
});
RefreshIcon.displayName = 'RefreshIcon';

// Image Placeholder Icon - for missing images
export const ImagePlaceholderIcon = React.memo(({ className = "w-20 h-20", size }: IconProps) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    return (
        <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
});
ImagePlaceholderIcon.displayName = 'ImagePlaceholderIcon';

// Check Circle Icon - for success states
export const CheckCircleIcon = React.memo(({ className = "w-5 h-5", size }: IconProps) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    return (
        <svg className={sizeClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
});
CheckCircleIcon.displayName = 'CheckCircleIcon';

// Spinner Icon - for loading states
export const SpinnerIcon = React.memo(({ className = "w-4 h-4", size }: IconProps) => {
    const sizeClass = size ? `w-${size} h-${size}` : className;

    return (
        <div className={`${sizeClass} animate-spin border-2 border-current border-t-transparent rounded-full`} />
    );
});
SpinnerIcon.displayName = 'SpinnerIcon';
