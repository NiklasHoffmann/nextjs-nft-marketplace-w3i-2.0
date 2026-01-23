'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Sell Flow Error Boundary
 * 
 * Catches errors in the sell/listing flow and provides context-specific fallback UI.
 */
export default function SellError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Sell flow error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
            <div className="max-w-lg w-full space-y-6 text-center">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="rounded-full bg-orange-100 p-6">
                        <svg className="h-16 w-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Listing Error
                    </h1>
                    <p className="text-lg text-gray-600">
                        An error occurred during the listing process.
                    </p>
                    {error.message && (
                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800 font-mono break-words text-left">
                                {error.message}
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-gray-500">
                        Don't worry - your NFTs are safe. No transactions were made.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                    <Link
                        href="/wallet"
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        View Wallet
                    </Link>
                </div>
            </div>
        </div>
    );
}
