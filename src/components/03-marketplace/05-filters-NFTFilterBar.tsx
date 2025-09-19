"use client";

import React, { useState, useEffect } from 'react';

export interface NFTFilters {
    // Category filters
    categories: string[];

    // Price filters
    priceMin?: number;
    priceMax?: number;

    // Rating filters
    minRating?: number;

    // Stats filters
    minViews?: number;
    minLikes?: number;
    minWatchlistCount?: number;

    // Search
    searchTerm?: string;

    // Rarity filter
    rarities: string[];
}

export interface NFTSortOptions {
    field: 'price' | 'rating' | 'views' | 'likes' | 'watchlistCount' | 'name' | 'created';
    direction: 'asc' | 'desc';
}

interface NFTFilterBarProps {
    onFiltersChange: (filters: NFTFilters) => void;
    onSortChange: (sort: NFTSortOptions) => void;
    totalItems: number;
    filteredCount: number;
}

const AVAILABLE_CATEGORIES = [
    'Art', 'DigitalTwin', 'Collectible', 'Gaming', 'Music', 'Sports', 'Virtual Real Estate', 'Utility'
];

const AVAILABLE_RARITIES = [
    'common', 'uncommon', 'rare', 'epic', 'legendary'
];

const SORT_OPTIONS = [
    { field: 'price', label: 'Preis', icon: '💰' },
    { field: 'rating', label: 'Rating', icon: '⭐' },
    { field: 'views', label: 'Views', icon: '👁️' },
    { field: 'likes', label: 'Likes', icon: '❤️' },
    { field: 'watchlistCount', label: 'Watchlist', icon: '👀' },
    { field: 'name', label: 'Name', icon: '🔤' },
    { field: 'created', label: 'Erstellt', icon: '📅' },
] as const;

export function NFTFilterBar({
    onFiltersChange,
    onSortChange,
    totalItems,
    filteredCount
}: NFTFilterBarProps) {
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
    });

    const [sort, setSort] = useState<NFTSortOptions>({
        field: 'price',
        direction: 'desc'
    });

    const [showFilters, setShowFilters] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Update parent when filters change
    useEffect(() => {
        onFiltersChange(filters);
    }, [filters, onFiltersChange]);

    // Update parent when sort changes
    useEffect(() => {
        onSortChange(sort);
    }, [sort, onSortChange]);

    const updateFilters = (updates: Partial<NFTFilters>) => {
        setFilters(prev => ({ ...prev, ...updates }));
    };

    const updateSort = (field: NFTSortOptions['field']) => {
        setSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const clearAllFilters = () => {
        setFilters({
            categories: [],
            rarities: [],
        });
        setSort({ field: 'price', direction: 'desc' });
    };

    const toggleCategory = (category: string) => {
        const newCategories = filters.categories.includes(category)
            ? filters.categories.filter(c => c !== category)
            : [...filters.categories, category];
        updateFilters({ categories: newCategories });
    };

    const toggleRarity = (rarity: string) => {
        const newRarities = filters.rarities.includes(rarity)
            ? filters.rarities.filter(r => r !== rarity)
            : [...filters.rarities, rarity];
        updateFilters({ rarities: newRarities });
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'uncommon': return 'bg-green-100 text-green-800 border-green-300';
            case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const hasActiveFilters = filters.categories.length > 0 || filters.rarities.length > 0 ||
        filters.priceMin || filters.priceMax || filters.minRating || filters.minViews ||
        filters.minLikes || filters.minWatchlistCount || filters.searchTerm;

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                {/* Compact Header Row */}
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Search + Results Count */}
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Suche NFTs..."
                                value={filters.searchTerm || ''}
                                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                            {filteredCount}/{totalItems}
                        </div>
                    </div>

                    {/* Center: Quick Sort Buttons */}
                    <div className="hidden sm:flex items-center gap-1">
                        {SORT_OPTIONS.slice(0, 4).map((option) => (
                            <button
                                key={option.field}
                                onClick={() => updateSort(option.field)}
                                className={`px-2 py-1.5 text-xs rounded-md transition-all duration-200 flex items-center gap-1 ${sort.field === option.field
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                title={`Sort by ${option.label}`}
                            >
                                <span className="text-xs">{option.icon}</span>
                                <span className="hidden lg:inline">{option.label}</span>
                                {sort.field === option.field && (
                                    <svg
                                        className={`w-3 h-3 transition-transform duration-200 ${sort.direction === 'asc' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Right: Filter Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${showFilters || hasActiveFilters
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span>Filter</span>
                            {hasActiveFilters && (
                                <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                                    {[filters.categories.length, filters.rarities.length].filter(n => n > 0).reduce((a, b) => a + b, 0)}
                                </span>
                            )}
                        </button>

                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Alle Filter zurücksetzen"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        {/* Categories - Horizontal Pills */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Kategorien</label>
                                <span className="text-xs text-gray-500">{filters.categories.length} ausgewählt</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {AVAILABLE_CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => toggleCategory(category)}
                                        className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-200 ${filters.categories.includes(category)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rarities - Horizontal Pills */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Seltenheit</label>
                                <span className="text-xs text-gray-500">{filters.rarities.length} ausgewählt</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {AVAILABLE_RARITIES.map((rarity) => (
                                    <button
                                        key={rarity}
                                        onClick={() => toggleRarity(rarity)}
                                        className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-200 capitalize ${filters.rarities.includes(rarity)
                                            ? 'ring-2 ring-blue-500 ' + getRarityColor(rarity)
                                            : getRarityColor(rarity) + ' opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        {rarity}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Filters Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <svg className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span>Erweiterte Filter</span>
                            </button>

                            {/* All Sort Options for Mobile */}
                            <div className="sm:hidden">
                                <select
                                    value={`${sort.field}-${sort.direction}`}
                                    onChange={(e) => {
                                        const [field, direction] = e.target.value.split('-') as [NFTSortOptions['field'], 'asc' | 'desc'];
                                        setSort({ field, direction });
                                    }}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <React.Fragment key={option.field}>
                                            <option value={`${option.field}-desc`}>
                                                {option.icon} {option.label} ↓
                                            </option>
                                            <option value={`${option.field}-asc`}>
                                                {option.icon} {option.label} ↑
                                            </option>
                                        </React.Fragment>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showAdvanced && (
                            <div className="pt-3 border-t border-gray-100 space-y-3">
                                {/* Price Range - Inline */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Preis (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={filters.priceMin || ''}
                                            onChange={(e) => updateFilters({ priceMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Max Preis (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="∞"
                                            value={filters.priceMax || ''}
                                            onChange={(e) => updateFilters({ priceMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Stats Filters - Compact Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Rating</label>
                                        <select
                                            value={filters.minRating || ''}
                                            onChange={(e) => updateFilters({ minRating: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Alle</option>
                                            <option value="1">⭐ 1+</option>
                                            <option value="2">⭐ 2+</option>
                                            <option value="3">⭐ 3+</option>
                                            <option value="4">⭐ 4+</option>
                                            <option value="5">⭐ 5</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Views</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={filters.minViews || ''}
                                            onChange={(e) => updateFilters({ minViews: e.target.value ? parseInt(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Likes</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={filters.minLikes || ''}
                                            onChange={(e) => updateFilters({ minLikes: e.target.value ? parseInt(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Watchlist</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={filters.minWatchlistCount || ''}
                                            onChange={(e) => updateFilters({ minWatchlistCount: e.target.value ? parseInt(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NFTFilterBar;