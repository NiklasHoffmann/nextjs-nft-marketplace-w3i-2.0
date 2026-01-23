import { LoadingState } from '@/components/core/Loading';

/**
 * Admin Loading State
 * 
 * Displayed while admin pages are loading.
 * Shows a centered loading spinner with admin context.
 */
export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4">
                <LoadingState message="Loading admin panel..." className="py-20" />
            </div>
        </div>
    );
}
