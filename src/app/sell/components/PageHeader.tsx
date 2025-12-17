/**
 * Page Header Component with title and listing type toggle
 */

import { ListingType } from '../types';

interface PageHeaderProps {
    listingType: ListingType;
    onListingTypeChange: (type: ListingType) => void;
    showToggle: boolean;
}

export function PageHeader({ listingType, onListingTypeChange, showToggle }: PageHeaderProps) {
    if (!showToggle) return null;

    return (
        <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <button
                    onClick={() => onListingTypeChange('single')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                        listingType === 'single'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Einzeln
                </button>
                <button
                    onClick={() => onListingTypeChange('batch')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                        listingType === 'batch'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Batch-Listing
                    <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Neu</span>
                </button>
            </div>
        </div>
    );
}
