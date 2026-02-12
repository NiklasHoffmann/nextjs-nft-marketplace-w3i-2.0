'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { devLog } from '@/utils';

/**
 * Global Error Boundary
 * 
 * Catches errors in the app and provides a fallback UI.
 * Allows users to retry or navigate away.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console in development
        devLog.error('Error boundary caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg w-full space-y-8 text-center">
                {/* Error Illustration */}
                <div className="relative">
                    <div className="text-9xl font-bold text-white/10 select-none">ERROR</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">⚠️</div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-white">
                        Something went wrong!
                    </h1>
                    <p className="text-xl text-gray-300">
                        An unexpected error occurred.
                    </p>
                    {error.message && (
                        <div className="mt-4 p-4 bg-black/30 rounded-lg">
                            <p className="text-sm text-gray-300 font-mono break-words">
                                {error.message}
                            </p>
                        </div>
                    )}
                    {error.digest && (
                        <p className="text-xs text-gray-400 font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go Home
                    </Link>
                </div>

                {/* Help Text */}
                <div className="pt-8 border-t border-gray-700">
                    <p className="text-sm text-gray-400">
                        If this error persists, please try refreshing the page or contact support.
                    </p>
                </div>
            </div>
        </div>
    );
}
