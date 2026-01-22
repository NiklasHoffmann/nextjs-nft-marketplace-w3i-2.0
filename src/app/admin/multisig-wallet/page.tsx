/**
 * MultiSig Wallet Admin Page
 * 
 * Main page for managing pending MultiSig transactions.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminModeIndicator } from '@/components/admin/AdminModeIndicator';
import { MultiSigTransactionCard } from '@/components/admin/multisig/MultiSigTransactionCard';
import { useMultisigPendingTransactions } from '@/hooks';
import { LoadingState } from '@/components/core/Loading/LoadingState';

const DIAMOND_ADDRESS = process.env.NEXT_PUBLIC_DIAMOND_ADDRESS!;

export default function MultiSigWalletPage() {
    const { pendingTransactions, isLoading, error, refetch } = useMultisigPendingTransactions(DIAMOND_ADDRESS);
    const [filter, setFilter] = useState<'all' | 'ready' | 'pending'>('all');

    const filteredTransactions = pendingTransactions.filter((tx) => {
        if (filter === 'ready') return tx.canExecute;
        if (filter === 'pending') return !tx.canExecute;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link
                            href="/admin"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Zurück zum Admin Panel
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">MultiSig Wallet</h1>
                        <p className="text-gray-600">
                            Verwalte ausstehende Transaktionen mit Multi-Signatur Bestätigung
                        </p>
                    </div>

                    {/* Admin Mode Indicator */}
                    <AdminModeIndicator diamondAddress={DIAMOND_ADDRESS} className="mb-6" />

                    {/* Actions Bar */}
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

                    {/* Content */}
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
                                        ? 'Keine Transaktionen bereit zur Ausführung'
                                        : 'Keine ausstehenden Bestätigungen'}
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

                    {/* Info Box */}
                    <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
                        <h3 className="font-semibold text-blue-900">So funktioniert MultiSig</h3>
                        <ul className="mt-2 space-y-1 text-sm text-blue-800">
                            <li>• Jeder Owner kann eine Transaktion vorschlagen</li>
                            <li>• 2 von 3 Ownern müssen bestätigen vor der Ausführung</li>
                            <li>• Transaktion wird automatisch bei der zweiten Bestätigung ausgeführt</li>
                            <li>• Der letzte Bestätiger zahlt die Ausführungs-Gasgebühren</li>
                            <li>• Du kannst deine Bestätigung vor Ausführung zurückziehen</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
