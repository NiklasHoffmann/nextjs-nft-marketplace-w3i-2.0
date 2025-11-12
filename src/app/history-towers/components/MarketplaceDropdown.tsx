'use client';

import { useState } from 'react';

interface MarketplaceDropdownProps {
    isGameActive: boolean;
}

export default function MarketplaceDropdown({ isGameActive }: MarketplaceDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`transition-all duration-300 ${isGameActive ? 'opacity-50' : ''}`}>
            {/* Dropdown Header/Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center justify-between transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-bold">🎮 IdeationMarket</h2>
                        <p className="text-xs text-white/80">NFT Marketplace mit Utility</p>
                    </div>
                </div>
                <svg
                    className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Content */}
            <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    {/* Info Text */}
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        Der dezentrale Marktplatz für NFTs mit echtem Nutzen
                    </p>

                    {/* Features Grid */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">NFTs mit echtem Nutzen</h3>
                                <p className="text-xs text-gray-600">
                                    Handel mit NFTs, die reale Services repräsentieren
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-0.5">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Sicher & Transparent</h3>
                                <p className="text-xs text-gray-600">
                                    Blockchain-basiert für maximale Sicherheit
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Schnell & Einfach</h3>
                                <p className="text-xs text-gray-600">
                                    Intuitive Benutzeroberfläche
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coming Soon Badge */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-bold text-yellow-900 text-sm">Bald verfügbar!</span>
                        </div>
                        <p className="text-xs text-yellow-800 leading-relaxed">
                            Der Marketplace wird in Kürze gelauncht. Viel Spaß beim Spielen!
                        </p>
                    </div>

                    {/* CTA Button */}
                    <button
                        disabled
                        className="w-full bg-gray-200 text-gray-500 font-semibold py-3 rounded-xl cursor-not-allowed text-sm"
                    >
                        Marketplace (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
}
