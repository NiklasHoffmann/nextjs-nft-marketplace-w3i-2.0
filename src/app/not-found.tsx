import Link from 'next/link';

/**
 * Global 404 Not Found Page
 * 
 * Displayed when no matching route is found.
 * Provides navigation back to key areas of the app.
 */
export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg w-full space-y-8 text-center">
                {/* 404 Illustration */}
                <div className="relative">
                    <div className="text-9xl font-bold text-white/10 select-none">404</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">🔍</div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-white">
                        Page Not Found
                    </h1>
                    <p className="text-xl text-gray-300">
                        Oops! The page you're looking for doesn't exist.
                    </p>
                    <p className="text-gray-400">
                        The NFT you're searching for might have been sold, or the URL might be incorrect.
                    </p>
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go Home
                    </Link>
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Browse Marketplace
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="pt-8 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-4">Quick Links</p>
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <Link href="/wallet" className="text-purple-400 hover:text-purple-300 transition-colors">
                            My Wallet
                        </Link>
                        <span className="text-gray-600">•</span>
                        <Link href="/sell" className="text-purple-400 hover:text-purple-300 transition-colors">
                            List NFT
                        </Link>
                        <span className="text-gray-600">•</span>
                        <Link href="/history-towers" className="text-purple-400 hover:text-purple-300 transition-colors">
                            Play Game
                        </Link>
                        <span className="text-gray-600">•</span>
                        <Link href="/cart" className="text-purple-400 hover:text-purple-300 transition-colors">
                            Shopping Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
