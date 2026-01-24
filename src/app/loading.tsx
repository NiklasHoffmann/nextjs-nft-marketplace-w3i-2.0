import { LoadingState } from '@/components/core/Loading';

/**
 * Global Loading State
 * 
 * Displayed while any page in the app is loading.
 * This provides a consistent loading experience across all routes.
 * 
 * Note: Route-specific loading states are no longer needed.
 * This global loading.tsx handles all routes unless a specific route
 * requires custom loading behavior.
 */
export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="container mx-auto px-4">
                <LoadingState message="Loading..." className="py-20" />
            </div>
        </div>
    );
}
