/**
 * Marketplace Governance Page
 *
 * Submit marketplace (Diamond) operations via MultiSig.
 */

'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { TransactionBuilder } from '@/app/admin/components/multisig/TransactionBuilder';
import { AdminModeIndicator } from '@/app/admin/components/shared/AdminModeIndicator';
import { getMarketplaceAddress } from '@/config';

export default function MarketplaceGovernancePage() {
    const chainId = useChainId();
    const marketplaceAddress = useMemo(() => {
        if (chainId) {
            const fromConfig = getMarketplaceAddress(chainId);
            if (fromConfig) return fromConfig;
        }
        return process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';
    }, [chainId]);
    const hasAddress = Boolean(marketplaceAddress);

    return (
        <div className="w-full">
            <div className="mb-6">
                <Link
                    href="/admin"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Zurueck zum Admin Panel
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Governance</h1>
                <p className="text-gray-600">
                    Marketplace-Operationen werden ueber die MultiSig Wallet ausgefuehrt.
                </p>
            </div>

            {hasAddress ? (
                <AdminModeIndicator diamondAddress={marketplaceAddress} className="mb-6" />
            ) : (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Marketplace address not configured for this network. Add it in src/config/networks.ts or set
                    NEXT_PUBLIC_MARKETPLACE_ADDRESS.
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <TransactionBuilder diamondAddress={marketplaceAddress} />
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h3 className="font-semibold text-gray-900">Wichtige Hinweise</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                        <span className="text-emerald-600">•</span>
                        <span>
                            Alle Marketplace-Operationen laufen als MultiSig-Transaktionen.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-emerald-600">•</span>
                        <span>
                            Owner muessen bestaetigen, bevor die Operation ausgefuehrt wird.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-emerald-600">•</span>
                        <span>
                            Die eigentliche Ausfuehrung passiert automatisch beim letzten Confirmation-Threshold.
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
