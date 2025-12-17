/**
 * NFT Search and Filter Controls
 */

import { NFTFilterOptions } from '../types';

interface NFTSearchFilterProps {
    filterOptions: NFTFilterOptions;
    onFilterChange: (updates: Partial<NFTFilterOptions>) => void;
    unlistedCount: number;
}

export function NFTSearchFilter({ filterOptions, onFilterChange, unlistedCount }: NFTSearchFilterProps) {
    return (
        <div className="mb-4 space-y-3">
            {/* Search Bar and Sort Controls */}
            <div className="flex gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={filterOptions.searchTerm}
                        onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
                        placeholder="Search by name, token ID, or address..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {filterOptions.searchTerm && (
                        <button
                            onClick={() => onFilterChange({ searchTerm: '' })}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2">
                    <select
                        value={filterOptions.sortBy}
                        onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    >
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="likes">Likes</option>
                        <option value="views">Views</option>
                        <option value="rating">Rating</option>
                        <option value="watchlist">Watchlist</option>
                        <option value="recent">Recently Added</option>
                    </select>

                    <button
                        onClick={() => onFilterChange({ 
                            sortOrder: filterOptions.sortOrder === 'asc' ? 'desc' : 'asc' 
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        title={`Sort ${filterOptions.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                    >
                        <svg 
                            className={`w-4 h-4 text-gray-600 ${filterOptions.sortOrder === 'desc' ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filterOptions.showOnlyUnlisted}
                        onChange={(e) => onFilterChange({ showOnlyUnlisted: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                        Show only unlisted NFTs
                    </span>
                </label>
                {filterOptions.showOnlyUnlisted && (
                    <span className="text-xs text-gray-500">
                        {unlistedCount} unlisted
                    </span>
                )}
            </div>
        </div>
    );
}
