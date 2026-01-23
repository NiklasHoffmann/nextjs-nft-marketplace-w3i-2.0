import Link from 'next/link';

/**
 * NFT Not Found Page
 * 
 * Displayed when an NFT doesn't exist or cannot be found.
 */
export default function NFTNotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
            <div className="max-w-lg w-full space-y-6 text-center">
                {/* 404 Illustration */}
                <div className="flex justify-center">
                    <div className="text-8xl">🖼️</div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900">
                        NFT Not Found
                    </h1>
                    <p className="text-xl text-gray-600">
                        This NFT doesn't exist or has been removed.
                    </p>
                    <p className="text-gray-500">
                        It might have been sold, burned, or the contract address is incorrect.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Browse Marketplace
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
