import { LoadingState } from '@/components/core/Loading';

/**
 * Wallet Loading State
 * 
 * Displayed while the wallet page is loading.
 * Shows a centered loading spinner with wallet context.
 */
export default function WalletLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4">
                <LoadingState message="Loading your wallet..." className="py-20" />
            </div>
        </div>
    );
}
