"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminModeIndicator } from '@/app/admin/components/shared/AdminModeIndicator';
import { MultiSigTransactionCard } from '@/app/admin/components/multisig/MultiSigTransactionCard';
import { useMultisigPendingTransactions } from '@/hooks';
import { LoadingState } from '@/components/core/Loading/LoadingState';
import { useChainId } from 'wagmi';
import { getMarketplaceAddress } from '@/config';

export default function MultiSigWalletPage() {
    const chainId = useChainId();
    const marketplaceAddress = useMemo(() => {
        if (chainId) {
            const fromConfig = getMarketplaceAddress(chainId);
            if (fromConfig) return fromConfig;
        }
        return process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';
    }, [chainId]);
    const hasAddress = Boolean(marketplaceAddress);

    const { pendingTransactions, isLoading, error, refetch } = useMultisigPendingTransactions(marketplaceAddress);
    const [filter, setFilter] = useState<'all' | 'ready' | 'pending'>('all');

    const filteredTransactions = pendingTransactions.filter((tx) => {
        if (filter === 'ready') return tx.canExecute;
        if (filter === 'pending') return !tx.canExecute;
        return true;
    });

    return (
        <div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">MultiSig Wallet</h1>
                <p className="text-gray-600">
                    Verwalte ausstehende Transaktionen mit Multi-Signatur Bestaetigung
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

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === 'all'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        Alle ({pendingTransactions.length})
                    </button>
                    <button
                        onClick={() => setFilter('ready')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === 'ready'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        Bereit ({pendingTransactions.filter((tx) => tx.canExecute).length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === 'pending'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        Ausstehend ({pendingTransactions.filter((tx) => !tx.canExecute).length})
                    </button>
                </div>

                <Link
                    href="/admin/multisig-wallet/submit"
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Transaktion erstellen
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingState message="Loading pending transactions..." />
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-sm text-red-800">{error}</p>
                    <button
                        onClick={refetch}
                        className="mt-4 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        Erneut versuchen
                    </button>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                    <p className="text-gray-600">
                        {filter === 'all'
                            ? 'Keine ausstehenden Transaktionen'
                            : filter === 'ready'
                                ? 'Keine Transaktionen bereit zur Ausfuehrung'
                                : 'Keine ausstehenden Bestaetigungen'}
                    </p>
                    <Link
                        href="/admin/multisig-wallet/submit"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Neue Transaktion erstellen
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {filteredTransactions.map((tx) => (
                        <MultiSigTransactionCard
                            key={tx.txIndex}
                            transaction={tx}
                            onConfirm={refetch}
                            onRevoke={refetch}
                        />
                    ))}
                </div>
            )}

            <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="font-semibold text-blue-900">So funktioniert MultiSig</h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    <li>• Jeder Owner kann eine Transaktion vorschlagen</li>
                    <li>• 2 von 3 Ownern muessen bestaetigen vor der Ausfuehrung</li>
                    <li>• Transaktion wird automatisch bei der zweiten Bestaetigung ausgefuehrt</li>
                    <li>• Der letzte Bestaetiger zahlt die Ausfuehrungs-Gasgebuehren</li>
                    <li>• Du kannst deine Bestaetigung vor Ausfuehrung zurueckziehen</li>
                </ul>
            </div>
        </div>
    );
}
