import { LoadingState } from '@/components/core/Loading';

/**
 * Marketplace Loading State
 * 
 * Displayed while the marketplace page is loading.
 * Shows a centered loading spinner with marketplace context.
 */
export default function MarketplaceLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4">
                <LoadingState message="Loading marketplace..." className="py-20" />
            </div>
        </div>
    );
}
