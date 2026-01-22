import React, { Suspense } from 'react';
import Link from 'next/link';
import { hasAdminAccess } from '@/utils';

// Separate component to handle URL parameters (requires Suspense in Next.js 15)
function AdminContent() {
    return (
        <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
                    <p className="text-gray-600">Zentrale Verwaltung für NFT Marketplace, MultiSig Governance und System-Konfiguration</p>
                </div>

                {/* Admin Features Grid - Sortiert von weniger wichtig zu WICHTIG */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">

                    {/* 1. Dashboard */}
                    <div className="bg-white border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-gray-900">Dashboard</h3>
                                <span className="text-xs text-blue-600 font-medium">System Overview</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            System-Status, Aktivitäts-Logs und Performance-Metriken im Überblick.
                        </p>
                        <div className="flex-grow"></div>
                        <Link
                            href="/admin/dashboard"
                            className="block w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                        >
                            Dashboard öffnen
                        </Link>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                <span>System-Übersicht</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                <span>Aktivitäts-Logs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                <span>Performance-Metriken</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. NFT Insights */}
                    <div className="bg-white border border-teal-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-teal-100 rounded-lg">
                                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-gray-900">NFT Insights</h3>
                                <span className="text-xs text-teal-600 font-medium">Content Management</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            NFT-Insights, Projekt-Informationen und erweiterte Metadaten verwalten.
                        </p>
                        <div className="flex-grow"></div>
                        <Link
                            href="/admin/insights"
                            className="block w-full px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors text-center"
                        >
                            Insights verwalten
                        </Link>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                                <span>NFT-Insights erstellen</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                                <span>Projekt-Informationen</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                                <span>Tags & Kategorien</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. MultiSig Governance (Off-Chain) */}
                    <div className="bg-white border border-indigo-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-gray-900">MultiSig Governance</h3>
                                <span className="text-xs text-indigo-600 font-medium">Off-Chain Proposals</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Off-Chain Proposal System für Multi-Admin Confirmations und Ownership Transfer.
                        </p>
                        <div className="flex-grow"></div>
                        <Link
                            href="/admin/multisig"
                            className="block w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
                        >
                            Governance öffnen
                        </Link>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                <span>Proposal System</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                <span>Multi-Admin Confirmations</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                <span>Ownership Transfer</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Direct Marketplace Admin */}
                    <div className="bg-white border border-purple-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-gray-900">Marketplace Admin</h3>
                                <span className="text-xs text-purple-600 font-medium">Direct Access</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Direkte Marketplace-Funktionen als Contract Owner ohne MultiSig (für Notfälle).
                        </p>
                        <div className="flex-grow"></div>
                        <Link
                            href="/admin/marketplace"
                            className="block w-full px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
                        >
                            Marketplace verwalten
                        </Link>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                <span>Innovation Fee einstellen</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                <span>Collection Whitelist</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                <span>Listings bereinigen</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. MultiSig Wallet (On-Chain) - HÖCHSTE PRIORITÄT */}
                    <div className="bg-white border border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-gray-900">MultiSig Wallet</h3>
                                <span className="text-xs text-green-600 font-medium">On-Chain Security</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Sichere Diamond Contract Operationen mit 2/3 MultiSig Consensus auf Mainnet & Sepolia.
                        </p>
                        <div className="flex-grow"></div>
                        <Link
                            href="/admin/multisig-wallet"
                            className="block w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors text-center"
                        >
                            MultiSig Wallet öffnen
                        </Link>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span>2/3 Owner Confirmations</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span>Auto-Execution on Threshold</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span>Diamond Operations via MultiSig</span>
                            </div>
                        </div>
                    </div>

                    {/* 6. Settings */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-gray-900">Einstellungen</h3>
                                <span className="text-xs text-gray-600 font-medium">System Config</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            System-Konfiguration, Environment Variables und Admin-Zugriffsverwaltung.
                        </p>
                        <div className="flex-grow"></div>
                        <Link
                            href="/admin/settings"
                            className="block w-full px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors text-center"
                        >
                            Einstellungen öffnen
                        </Link>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span>System-Konfiguration</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span>Environment Variables</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                <span>Admin Access Control</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend - Prioritäten Erklärung */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="p-1 bg-green-200 rounded">
                                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-green-800 mb-1">Production Ready - MultiSig Wallet</h4>
                                <p className="text-sm text-green-700">
                                    On-Chain Smart Contract auf Mainnet & Sepolia deployed. Höchste Sicherheit für kritische Operationen.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="p-1 bg-blue-200 rounded">
                                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-blue-800 mb-1">Admin-Zugriff aktiv</h4>
                                <p className="text-sm text-blue-700">
                                    Du hast vollen Zugriff auf alle Admin-Funktionen. Verwende diese Berechtigung verantwortungsvoll.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Suspense fallback={
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
                            <div className="space-y-4">
                                <div className="h-24 bg-gray-200 rounded"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="h-32 bg-gray-200 rounded"></div>
                                    <div className="h-32 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }>
                <AdminContent />
            </Suspense>
        </div>
    );
}
