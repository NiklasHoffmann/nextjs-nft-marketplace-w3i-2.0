import { LoadingState } from '@/components/core/Loading';

export default function LoadingSpinner() {
    return (
        <LoadingState
            size="lg"
            variant="centered"
            message="Loading NFT details..."
            className="min-h-screen bg-gray-50"
        />
    );
}
