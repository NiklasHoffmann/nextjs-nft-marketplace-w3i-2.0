'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Admin Error Boundary
 * 
 * Catches errors in the admin panel and provides admin-specific fallback UI.
 */
export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
            <div className="max-w-lg w-full space-y-6 text-center">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 p-6">
                        <svg className="h-16 w-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Admin Panel Error
                    </h1>
                    <p className="text-lg text-gray-600">
                        An error occurred in the admin panel.
                    </p>
                    {error.message && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 font-mono break-words text-left">
                                {error.message}
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                    </button>
                    <Link
                        href="/admin"
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Admin Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
