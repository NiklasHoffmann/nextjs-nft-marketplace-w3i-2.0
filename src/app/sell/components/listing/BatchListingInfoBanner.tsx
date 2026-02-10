/**
 * Info Banner for promoting batch listing feature
 */

interface BatchListingInfoBannerProps {
    onBatchClick: () => void;
}

export function BatchListingInfoBanner({ onBatchClick }: BatchListingInfoBannerProps) {
    return (
        <div className="lg:col-span-2 mb-4">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">
                        💡 Tipp: Möchten Sie mehrere NFTs gleichzeitig listen?
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                        Nutzen Sie die{' '}
                        <button
                            onClick={onBatchClick}
                            className="font-semibold underline hover:text-purple-900"
                        >
                            Batch-Listing Funktion
                        </button>{' '}
                        fuer effizientes Listing (nur Verkauf) mit festen oder aufsteigenden Preisen.
                    </p>
                </div>
            </div>
        </div>
    );
}
