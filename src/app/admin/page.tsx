import React, { Suspense } from 'react';
import Link from 'next/link';
import { hasAdminAccess } from '@/utils';

// Separate component to handle URL parameters (requires Suspense in Next.js 15)
function AdminContent() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
                    <p className="text-gray-600">Verwalte NFT-Insights, Projekte und weitere Admin-Funktionen</p>
                </div>

                {/* Admin Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* NFT Insights Management */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 ml-3">NFT Insights</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Erstelle und bearbeite detaillierte NFT-Insights, Projektinformationen und Metadaten-Erweiterungen.
                        </p>
                        <div className="space-y-2">
                            <Link
                                href="/admin/insights"
                                className="block w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
                            >
                                Insights verwalten
                            </Link>
                            <div className="text-xs text-gray-500">
                                • NFT-spezifische Insights erstellen<br />
                                • Projekt-Informationen verwalten<br />
                                • Tags und Kategorien bearbeiten
                            </div>
                        </div>
                    </div>

                    {/* Dashboard */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 ml-3">Dashboard</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Übersicht über Admin-Aktivitäten, Statistiken und System-Status.
                        </p>
                        <div className="space-y-2">
                            <Link
                                href="/admin/dashboard"
                                className="block w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors text-center"
                            >
                                Dashboard öffnen
                            </Link>
                            <div className="text-xs text-gray-500">
                                • System-Übersicht<br />
                                • Aktivitäts-Logs<br />
                                • Performance-Metriken
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 ml-3">Einstellungen</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            System-Konfiguration und Admin-Einstellungen verwalten.
                        </p>
                        <div className="space-y-2">
                            <button
                                disabled
                                className="block w-full px-4 py-2 bg-gray-300 text-gray-500 text-sm rounded-lg cursor-not-allowed text-center"
                            >
                                Bald verfügbar
                            </button>
                            <div className="text-xs text-gray-500">
                                • System-Konfiguration<br />
                                • Benutzer-Verwaltung<br />
                                • Sicherheits-Einstellungen
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Info */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-blue-200 rounded">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-blue-800 mb-1">Admin-Zugriff erkannt</h4>
                            <p className="text-sm text-blue-600">
                                Du hast vollen Zugriff auf alle Admin-Funktionen. Verwende diese Berechtigung verantwortungsvoll.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8">
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
        }>
            <AdminContent />
        </Suspense>
    );
}