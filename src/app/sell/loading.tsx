import { LoadingState } from '@/components/core/Loading';

/**
 * Sell Page Loading State
 * 
 * Displayed while the sell page is loading.
 * Shows a centered loading spinner with listing context.
 */
export default function SellLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4">
                <LoadingState message="Loading listing flow..." className="py-20" />
            </div>
        </div>
    );
}
