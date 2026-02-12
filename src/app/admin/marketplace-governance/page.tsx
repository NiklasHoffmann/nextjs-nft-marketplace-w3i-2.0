/**
 * Marketplace Governance Page
 *
 * Submit marketplace (Diamond) operations via MultiSig.
 */

'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useChainId, useReadContract } from 'wagmi';
import { TransactionBuilder } from '@/app/admin/components/multisig/TransactionBuilder';
import { AdminModeIndicator } from '@/app/admin/components/shared/AdminModeIndicator';
import { AddressWithEns } from '@/app/admin/components/shared/AddressWithEns';
import { getMarketplaceAddress, getMultisigAddress } from '@/config';
import { useMultisigPendingTransactions } from '@/hooks';
import { MultiSigTransactionCard } from '@/app/admin/components/multisig/MultiSigTransactionCard';
import { LoadingState } from '@/components/core/Loading/LoadingState';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';
import { MULTISIG_ADDRESSES } from '@/types';

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

    const multisigAddress = useMemo(() => {
        if (!chainId) return '';
        return getMultisigAddress(chainId) || (chainId === 1 ? MULTISIG_ADDRESSES.mainnet : MULTISIG_ADDRESSES.sepolia);
    }, [chainId]);

    const { data: contractOwner } = useReadContract({
        address: marketplaceAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getContractOwner',
        query: { enabled: hasAddress },
    });

    const isMultisigOwner = Boolean(
        contractOwner && multisigAddress && String(contractOwner).toLowerCase() === multisigAddress.toLowerCase()
    );

    const {
        pendingTransactions,
        recentTransactions,
        isLoading,
        error,
        refetch
    } = useMultisigPendingTransactions(marketplaceAddress, { includeInactive: true, maxTransactions: 10 });

    const marketplacePendingTransactions = useMemo(() => {
        const normalizedMarketplaceAddress = marketplaceAddress.toLowerCase();
        return pendingTransactions.filter((tx) => {
            if (!tx.to) return false;
            return tx.to.toLowerCase() === normalizedMarketplaceAddress;
        });
    }, [pendingTransactions, marketplaceAddress]);

    const marketplaceRecentTransactions = useMemo(() => {
        const normalizedMarketplaceAddress = marketplaceAddress.toLowerCase();
        return recentTransactions.filter((tx) => {
            if (!tx.to) return false;
            return tx.to.toLowerCase() === normalizedMarketplaceAddress;
        });
    }, [recentTransactions, marketplaceAddress]);

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

            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Marketplace-Transaktionen</h2>
                    <button
                        onClick={refetch}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        type="button"
                    >
                        Aktualisieren
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingState message="Loading pending transactions..." />
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-gray-900">Ausstehend</h3>
                                <span className="text-xs text-gray-500">{marketplacePendingTransactions.length} aktiv</span>
                            </div>
                            {marketplacePendingTransactions.length === 0 ? (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                                    Keine ausstehenden Marketplace-Transaktionen.
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2">
                                    {marketplacePendingTransactions.map((tx) => (
                                        <MultiSigTransactionCard
                                            key={tx.txIndex}
                                            transaction={tx}
                                            onConfirm={refetch}
                                            onRevoke={refetch}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-gray-900">Letzte Transaktionen</h3>
                                <span className="text-xs text-gray-500">{marketplaceRecentTransactions.length} gefunden</span>
                            </div>
                            {marketplaceRecentTransactions.length === 0 ? (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                                    Keine Transaktionen gefunden.
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2">
                                    {marketplaceRecentTransactions.map((tx) => (
                                        <MultiSigTransactionCard
                                            key={`recent-${tx.txIndex}`}
                                            transaction={tx}
                                            onConfirm={refetch}
                                            onRevoke={refetch}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="mb-6 mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ownership Status</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs uppercase text-gray-500">Marketplace Owner</p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-900">
                            <AddressWithEns address={String(contractOwner || '')} showAddress />
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs uppercase text-gray-500">MultiSig Wallet</p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-900">
                            <AddressWithEns address={multisigAddress} showAddress />
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    {isMultisigOwner ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                            ✅ Ownership liegt bei der MultiSig Wallet
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                            ⚠️ Ownership ist nicht bei der MultiSig Wallet
                        </div>
                    )}
                </div>

                {!isMultisigOwner && (
                    <p className="mt-3 text-sm text-amber-800">
                        Marketplace-Governance Transaktionen werden scheitern, bis die Ownership auf die MultiSig Wallet
                        uebertragen ist.
                    </p>
                )}
            </div>

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
