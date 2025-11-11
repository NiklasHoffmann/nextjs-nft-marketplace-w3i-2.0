'use client';

interface MarketplaceInfoProps {
    isGameActive: boolean;
}

export default function MarketplaceInfo({ isGameActive }: MarketplaceInfoProps) {
    return (
        <div className={`h-full transition-all duration-300 ${isGameActive ? 'blur-sm opacity-50' : ''}`}>
            <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 #F1F5F9'
                }}>
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">IdeationMarket</h2>
                        </div>
                        <p className="text-base text-gray-600">
                            Der dezentrale Marktplatz für Utility NFTs
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-5 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mt-1">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-base mb-1.5">NFTs mit echtem Nutzen</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Handel mit NFTs, die reale Services und Dienstleistungen repräsentieren
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mt-1">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-base mb-1.5">Sicher & Transparent</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Blockchain-basiert für maximale Sicherheit und Transparenz
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mt-1">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-base mb-1.5">Schnell & Einfach</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Intuitive Benutzeroberfläche für reibungslosen Handel
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Coming Soon Badge */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5 mb-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-bold text-yellow-900 text-base">Bald verfügbar!</span>
                        </div>
                        <p className="text-sm text-yellow-800 leading-relaxed">
                            Der Marketplace wird in Kürze gelauncht. Viel Spaß beim Spielen in der Zwischenzeit!
                        </p>
                    </div>

                    {/* Call to Action */}
                    <div className="space-y-3">
                        <button
                            disabled
                            className="w-full bg-gray-200 text-gray-500 font-semibold py-3.5 rounded-xl cursor-not-allowed text-base"
                        >
                            Marketplace (Coming Soon)
                        </button>
                        <p className="text-sm text-center text-gray-500">
                            Spiele jetzt History Towers und sammle Highscores! →
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
