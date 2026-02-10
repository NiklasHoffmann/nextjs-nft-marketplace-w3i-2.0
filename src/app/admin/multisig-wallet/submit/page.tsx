/**
 * Submit MultiSig Transaction Page
 * 
 * Page for creating new MultiSig transaction proposals.
 */

'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { WalletOperationBuilder } from '@/app/admin/components/multisig/WalletOperationBuilder';
import { AdminModeIndicator } from '@/app/admin/components/shared/AdminModeIndicator';
import { getMarketplaceAddress } from '@/config';

export default function SubmitTransactionPage() {
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
        <div>
            <div className="mb-6">
                <Link
                    href="/admin/multisig-wallet"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Zurueck zu Transaktionen
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet-Transaktion erstellen</h1>
                <p className="text-gray-600">
                    Erstelle einen neuen Wallet-Transaktionsvorschlag zur MultiSig Bestaetigung
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
                <WalletOperationBuilder />
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h3 className="font-semibold text-gray-900">Wichtige Hinweise</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>
                            Alle Transaktionen benoetigen <strong>2 von 3 Owner-Bestaetigungen</strong> vor der Ausfuehrung
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>
                            Nach dem Einreichen koennen andere Owner die Transaktion pruefen und bestaetigen
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>
                            Transaktion wird <strong>automatisch ausgefuehrt</strong> wenn der zweite Owner bestaetigt
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>
                            Du zahlst Gasgebuehren fuer das Einreichen. Der letzte Bestaetiger zahlt die Ausfuehrungsgebuehren.
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>
                            Ueberpruefe alle Parameter vor dem Einreichen - Transaktionen koennen nicht bearbeitet werden
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
