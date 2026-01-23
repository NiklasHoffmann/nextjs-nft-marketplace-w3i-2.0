/**
 * Submit MultiSig Transaction Page
 * 
 * Page for creating new MultiSig transaction proposals.
 */

'use client';

import Link from 'next/link';
import { TransactionBuilder } from '@/app/admin/components/multisig/TransactionBuilder';
import { AdminModeIndicator } from '@/app/admin/components/ui/AdminModeIndicator';

const DIAMOND_ADDRESS = process.env.NEXT_PUBLIC_DIAMOND_ADDRESS!;

export default function SubmitTransactionPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link
                            href="/admin/multisig-wallet"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Zurück zu Transaktionen
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaktion erstellen</h1>
                        <p className="text-gray-600">
                            Erstelle einen neuen Transaktionsvorschlag zur MultiSig Bestätigung
                        </p>
                    </div>

                    {/* Admin Mode Indicator */}
                    <AdminModeIndicator diamondAddress={DIAMOND_ADDRESS} className="mb-6" />

                    {/* Transaction Builder */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <TransactionBuilder diamondAddress={DIAMOND_ADDRESS} />
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
                        <h3 className="font-semibold text-gray-900">Wichtige Hinweise</h3>
                        <ul className="mt-2 space-y-2 text-sm text-gray-700">
                            <li className="flex gap-2">
                                <span className="text-green-600">•</span>
                                <span>
                                    Alle Transaktionen benötigen <strong>2 von 3 Owner-Bestätigungen</strong> vor der Ausführung
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-600">•</span>
                                <span>
                                    Nach dem Einreichen können andere Owner die Transaktion überprüfen und bestätigen
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-600">•</span>
                                <span>
                                    Transaktion wird <strong>automatisch ausgeführt</strong> wenn der zweite Owner bestätigt
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-600">•</span>
                                <span>
                                    Du zahlst Gasgebühren für das Einreichen. Der letzte Bestätiger zahlt die Ausführungsgebühren.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-600">•</span>
                                <span>
                                    Überprüfe alle Parameter vor dem Einreichen - Transaktionen können nicht bearbeitet werden
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
