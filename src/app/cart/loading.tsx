import { LoadingState } from '@/components/core/Loading';

/**
 * Cart Loading State
 * 
 * Displayed while the cart page is loading.
 * Shows a centered loading spinner with cart context.
 */
export default function CartLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4">
                <LoadingState message="Loading cart..." className="py-20" />
            </div>
        </div>
    );
}
