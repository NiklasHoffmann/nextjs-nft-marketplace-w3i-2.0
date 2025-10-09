"use client";

import React, { useState, useEffect, useRef } from 'react';

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
    currentSort: NFTSortOptions;
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
    {
        field: 'price',
        label: 'Preis',
        icon: (
            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    {
        field: 'rating',
        label: 'Rating',
        icon: (
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        )
    },
    {
        field: 'views',
        label: 'Views',
        icon: (
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        )
    },
    {
        field: 'likes',
        label: 'Likes',
        icon: (
            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        )
    },
    {
        field: 'watchlistCount',
        label: 'Watchlist',
        icon: (
            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        )
    },
    {
        field: 'name',
        label: 'Name',
        icon: (
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
        )
    },
    {
        field: 'created',
        label: 'Erstellt',
        icon: (
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    },
] as const;

export function NFTFilterBar({
    onFiltersChange,
    onSortChange,
    currentSort,
    totalItems,
    filteredCount
}: NFTFilterBarProps) {
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
    });

    const [showFilters, setShowFilters] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show when scrolling up, hide when scrolling down
            if (currentScrollY < lastScrollY.current) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY.current) {
                setIsVisible(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // Empty dependency array - only setup once

    // Update parent when filters change
    useEffect(() => {
        onFiltersChange(filters);
    }, [filters, onFiltersChange]);

    // Sort is now managed by parent component
    // No need for useEffect to sync sort changes

    const updateFilters = (updates: Partial<NFTFilters>) => {
        setFilters(prev => ({ ...prev, ...updates }));
    };

    const updateSort = (field: NFTSortOptions['field']) => {
        const newSort = {
            field,
            direction: currentSort.field === field && currentSort.direction === 'desc' ? 'asc' as const : 'desc' as const
        };
        onSortChange(newSort);
    };

    const clearAllFilters = () => {
        setFilters({
            categories: [],
            rarities: [],
        });
        onSortChange({ field: 'price', direction: 'desc' });
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
        <div
            className={`bg-white border-b border-gray-200 shadow-sm fixed top-16 left-0 right-0 z-30 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
                {/* Compact Header Row */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Left: Results Count */}
                    <div className="flex items-center gap-2">
                        <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                            <span className="font-medium text-gray-700">{filteredCount}</span>
                            <span className="hidden sm:inline"> / {totalItems} NFTs</span>
                            <span className="sm:hidden">/{totalItems}</span>
                        </div>
                    </div>

                    {/* Center: Quick Sort Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Mobile: Show top 3 as icon-only */}
                        <div className="flex sm:hidden items-center gap-1">
                            {SORT_OPTIONS.slice(0, 3).map((option) => (
                                <button
                                    key={option.field}
                                    onClick={() => updateSort(option.field)}
                                    className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center border ${currentSort.field === option.field
                                        ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200 border-blue-200'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                        }`}
                                    title={`Sort by ${option.label}`}
                                >
                                    {option.icon}
                                </button>
                            ))}
                        </div>

                        {/* Desktop: Show top 5 with labels */}
                        <div className="hidden sm:flex items-center gap-2">
                            {SORT_OPTIONS.slice(0, 5).map((option) => (
                                <button
                                    key={option.field}
                                    onClick={() => updateSort(option.field)}
                                    className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 min-w-[40px] border ${currentSort.field === option.field
                                        ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200 border-blue-200'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                        }`}
                                    title={`Sort by ${option.label}`}
                                >
                                    {option.icon}
                                    <span className="hidden md:inline text-sm font-medium">{option.label}</span>
                                    {/* Platzhalter für Pfeil - immer da, aber nur sichtbar wenn aktiv */}
                                    <svg
                                        className={`w-3 h-3 transition-all duration-200 ${currentSort.field === option.field
                                            ? `opacity-100 ${currentSort.direction === 'asc' ? 'rotate-180' : 'rotate-0'}`
                                            : 'opacity-0'
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Filter Controls */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 flex items-center gap-1 sm:gap-2 border text-sm ${showFilters || hasActiveFilters
                                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200 border-blue-200'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span className="hidden sm:inline font-medium">Filter</span>
                            {/* Badge - Always rendered for layout stability */}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium min-w-[20px] inline-flex items-center justify-center transition-all duration-200 ${hasActiveFilters
                                ? 'bg-blue-600 text-white opacity-100 scale-100'
                                : 'bg-transparent text-transparent opacity-0 scale-75'
                                }`}>
                                {hasActiveFilters
                                    ? [filters.categories.length, filters.rarities.length].filter(n => n > 0).reduce((a, b) => a + b, 0)
                                    : '0'
                                }
                            </span>
                        </button>

                        {/* Clear Button - Always rendered, visibility controlled */}
                        <button
                            onClick={clearAllFilters}
                            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 border border-transparent ${hasActiveFilters
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-100'
                                : 'text-transparent pointer-events-none opacity-0'
                                }`}
                            title="Alle Filter zurücksetzen"
                            disabled={!hasActiveFilters}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Active Filter Pills - Compact Overview */}
                {hasActiveFilters && !showFilters && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center">
                            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Aktive Filter:</span>

                            {/* Category Pills */}
                            {filters.categories.map((category) => (
                                <button
                                    key={`active-cat-${category}`}
                                    onClick={() => toggleCategory(category)}
                                    className="group flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                                >
                                    <span>{category}</span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ))}

                            {/* Rarity Pills */}
                            {filters.rarities.map((rarity) => (
                                <button
                                    key={`active-rar-${rarity}`}
                                    onClick={() => toggleRarity(rarity)}
                                    className={`group flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:opacity-100 transition-all capitalize ${getRarityColor(rarity)}`}
                                >
                                    <span>{rarity}</span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ))}

                            {/* Price Filter */}
                            {(filters.priceMin || filters.priceMax) && (
                                <button
                                    onClick={() => updateFilters({ priceMin: undefined, priceMax: undefined })}
                                    className="group flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors border border-green-200"
                                >
                                    <span>
                                        {filters.priceMin && filters.priceMax
                                            ? `${filters.priceMin}-${filters.priceMax} ETH`
                                            : filters.priceMin
                                                ? `>${filters.priceMin} ETH`
                                                : `<${filters.priceMax} ETH`
                                        }
                                    </span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {/* Rating Filter */}
                            {filters.minRating && (
                                <button
                                    onClick={() => updateFilters({ minRating: undefined })}
                                    className="group flex items-center gap-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors border border-yellow-200"
                                >
                                    <span>⭐ {filters.minRating}+</span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {/* Stats Filters */}
                            {filters.minViews && (
                                <button
                                    onClick={() => updateFilters({ minViews: undefined })}
                                    className="group flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                    <span>👁️ {filters.minViews}+</span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {filters.minLikes && (
                                <button
                                    onClick={() => updateFilters({ minLikes: undefined })}
                                    className="group flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors border border-red-200"
                                >
                                    <span>❤️ {filters.minLikes}+</span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {filters.minWatchlistCount && (
                                <button
                                    onClick={() => updateFilters({ minWatchlistCount: undefined })}
                                    className="group flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                                >
                                    <span>🔖 {filters.minWatchlistCount}+</span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}

                            {/* Search Term */}
                            {filters.searchTerm && (
                                <button
                                    onClick={() => updateFilters({ searchTerm: undefined })}
                                    className="group flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors border border-purple-200"
                                >
                                    <span>🔍 "{filters.searchTerm}"</span>
                                    <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Expandable Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-in slide-in-from-top-4 fade-in duration-200">
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
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 font-medium ${filters.categories.includes(category)
                                            ? 'bg-blue-50 text-blue-600 border-blue-200 ring-1 ring-blue-200 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
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
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 capitalize font-medium ${filters.rarities.includes(rarity)
                                            ? 'ring-2 ring-blue-500 shadow-sm ' + getRarityColor(rarity)
                                            : getRarityColor(rarity) + ' opacity-60 hover:opacity-100'
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
                                    value={`${currentSort.field}-${currentSort.direction}`}
                                    onChange={(e) => {
                                        const [field, direction] = e.target.value.split('-') as [NFTSortOptions['field'], 'asc' | 'desc'];
                                        onSortChange({ field, direction });
                                    }}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <React.Fragment key={option.field}>
                                            <option value={`${option.field}-desc`}>
                                                {option.label} ↓
                                            </option>
                                            <option value={`${option.field}-asc`}>
                                                {option.label} ↑
                                            </option>
                                        </React.Fragment>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showAdvanced && (
                            <div className="pt-3 border-t border-gray-100 space-y-3">
                                {/* Price Range - Inline with connector */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-2">Preisspanne (ETH)</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Min"
                                                value={filters.priceMin || ''}
                                                onChange={(e) => updateFilters({ priceMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                                            <div className="w-2 h-0.5 bg-gray-300"></div>
                                            <div className="w-2 h-0.5 bg-gray-300"></div>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Max"
                                                value={filters.priceMax || ''}
                                                onChange={(e) => updateFilters({ priceMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            />
                                        </div>
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