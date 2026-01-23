import { LoadingState } from '@/components/core/Loading';

/**
 * NFT Detail Loading State
 * 
 * Displayed while NFT detail pages are loading.
 * Shows a centered loading spinner with NFT context.
 */
export default function NFTDetailLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4">
                <LoadingState message="Loading NFT details..." className="py-20" />
            </div>
        </div>
    );
}
