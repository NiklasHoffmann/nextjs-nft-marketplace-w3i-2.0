/**
 * MigrationBanner Component
 * 
 * Shows upcoming MultiSig migration notice.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MigrationBannerProps {
    migrationDate?: Date;
    onDismiss?: () => void;
    showDismiss?: boolean;
}

export function MigrationBanner({
    migrationDate,
    onDismiss,
    showDismiss = true,
}: MigrationBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    const daysUntil = migrationDate
        ? Math.ceil((migrationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="relative rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4 shadow-sm">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                        {migrationDate ? 'MultiSig Migration Scheduled' : 'MultiSig System Ready'}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                        {migrationDate ? (
                            <p>
                                In <strong>{daysUntil} days</strong> ({migrationDate.toLocaleDateString()}), this
                                marketplace will migrate to MultiSig governance.
                            </p>
                        ) : (
                            <p>
                                MultiSig system is ready for deployment. All components have been integrated and
                                tested.
                            </p>
                        )}
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>All admin operations will require 2/3 owner confirmations</li>
                            <li>3 co-owners: Stefan, Wolfi, Niklas</li>
                            <li>Direct admin access will be disabled after migration</li>
                            <li>On-chain security with full transparency</li>
                        </ul>
                        <div className="mt-3 flex gap-3">
                            <Link
                                href="/admin/multisig-wallet"
                                className="font-medium text-yellow-800 underline hover:text-yellow-900"
                            >
                                Preview MultiSig Interface →
                            </Link>
                            <a
                                href="https://github.com/web3ideation/nextjs-nft-marketplace-w3i-2.0/blob/main/docs/admin/MULTISIG_MIGRATION_PLAN.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-yellow-800 underline hover:text-yellow-900"
                            >
                                Read Migration Plan →
                            </a>
                        </div>
                    </div>
                </div>
                {showDismiss && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
