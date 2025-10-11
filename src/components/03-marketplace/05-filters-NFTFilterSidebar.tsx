"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { NFTFilters, NFTSortOptions } from './05-filters-NFTFilterBar';

interface NFTFilterSidebarProps {
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
        field: 'price' as const,
        label: 'Preis',
        icon: (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    {
        field: 'rating' as const,
        label: 'Rating',
        icon: (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        )
    },
    {
        field: 'views' as const,
        label: 'Views',
        icon: (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        )
    },
    {
        field: 'likes' as const,
        label: 'Likes',
        icon: (
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        )
    },
    {
        field: 'watchlistCount' as const,
        label: 'Watchlist',
        icon: (
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        )
    },
    {
        field: 'name' as const,
        label: 'Name',
        icon: (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
        )
    },
    {
        field: 'created' as const,
        label: 'Erstellt',
        icon: (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    },
];

export function NFTFilterSidebar({
    onFiltersChange,
    onSortChange,
    currentSort,
    totalItems,
    filteredCount
}: NFTFilterSidebarProps) {
    const [filters, setFilters] = useState<NFTFilters>({
        categories: [],
        rarities: [],
    });

    const [isOpen, setIsOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // Track rotation per field for correct direction
    const [fieldRotations, setFieldRotations] = useState<Record<string, number>>({});

    // Collapsible sections state
    const [expandedSections, setExpandedSections] = useState({
        categories: true,  // Standardmäßig offen
        price: false,
        rating: false,
        stats: false,
        rarity: false,
        sort: false,
        search: false,
    });

    // Update parent when filters change
    useEffect(() => {
        onFiltersChange(filters);
    }, [filters]); // Removed onFiltersChange from dependencies to prevent infinite loop

    const updateFilters = (updates: Partial<NFTFilters>) => {
        setFilters(prev => ({ ...prev, ...updates }));
    };

    const updateSort = (field: NFTSortOptions['field']) => {
        const newDirection = currentSort.field === field && currentSort.direction === 'desc' ? 'asc' as const : 'desc' as const;

        // Immer +180° im Uhrzeigersinn
        setFieldRotations(prev => {
            const currentRotation = prev[field] || 0;
            return { ...prev, [field]: currentRotation + 180 };
        });

        onSortChange({ field, direction: newDirection });
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

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const activeFiltersCount = filters.categories.length + filters.rarities.length;

    // Öffne Panel bei Hover über Icon-Streifen oder Panel
    const handleMouseEnter = () => {
        setIsHovering(true);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        // Kleine Verzögerung bevor Panel schließt
        setTimeout(() => {
            setIsHovering(prev => {
                if (!prev) setIsOpen(false);
                return prev;
            });
        }, 300);
    };

    return (
        <>
            {/* Collapsed Sidebar - Kompletter linker Streifen - nur Desktop */}
            <div
                className="hidden md:flex fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 shadow-lg z-[56] flex-col items-center py-4 gap-3"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Logo/Lightbulb - oben */}
                <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <Image
                        src="/media/only-lightbulb-favicone.ico"
                        alt="W3I"
                        width={40}
                        height={40}
                        className="object-contain"
                    />
                </div>

                {/* Divider */}
                <div className="w-10 h-px bg-gray-300"></div>

                {/* Sort Buttons */}
                {SORT_OPTIONS.map((option) => (
                    <button
                        key={option.field}
                        onClick={() => updateSort(option.field)}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 relative ${currentSort.field === option.field
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                        title={`${option.label} ${currentSort.field === option.field ? (currentSort.direction === 'desc' ? '↓' : '↑') : ''}`}
                    >
                        {option.icon}

                        {/* Pfeil dreht sich wie Uhrzeiger um das Icon - rechts rum bei asc→desc, links rum bei desc→asc */}
                        {currentSort.field === option.field && (
                            <div
                                className="absolute top-1 left-1/2 -translate-x-1/2 transition-transform duration-500"
                                style={{
                                    transformOrigin: 'center 20px',
                                    transform: `translateX(-50%) rotate(${fieldRotations[option.field] || 0}deg)`
                                }}
                            >
                                <div className="w-0 h-0 border-l-[7.5px] border-l-transparent border-r-[7.5px] border-r-transparent border-b-[8px] border-b-white"></div>
                            </div>
                        )}
                    </button>
                ))}

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Filter Icon - zeigt aktive Filter */}
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-50 relative">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Slide-out Filter Panel */}
            <div
                className={`fixed left-16 top-0 h-full w-80 bg-white shadow-2xl z-[55] transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Header mit Logo */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-center mb-3">
                        {/* Logo */}
                        <Image
                            src="/media/Logo-w3i-marketplace.png"
                            alt="W3I Marketplace"
                            width={180}
                            height={45}
                            className="h-8 w-auto"
                        />
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                        <h3 className="text-sm font-bold text-gray-900">Filter & Sortierung</h3>
                        <p className="text-xs text-gray-600 mt-1">
                            {filteredCount} von {totalItems} NFTs
                        </p>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Alle Filter zurücksetzen
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Kategorien - Standardmäßig offen */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('categories')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <span>🏷️</span>
                                Kategorien
                            </h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.categories ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.categories && (
                            <div className="p-3 space-y-2 bg-white">
                                {AVAILABLE_CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => toggleCategory(category)}
                                        className={`w-full px-4 py-2.5 rounded-lg text-left transition-all text-sm ${filters.categories.includes(category)
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="font-medium">{category}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preis Filter */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('price')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-semibold text-gray-900">Preis</h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.price && (
                            <div className="p-3 space-y-3 bg-white">
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Preis (ETH)</label>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.01"
                                        value={filters.priceMin || ''}
                                        onChange={(e) => updateFilters({ priceMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Max Preis (ETH)</label>
                                    <input
                                        type="number"
                                        placeholder="100.0"
                                        step="0.01"
                                        value={filters.priceMax || ''}
                                        onChange={(e) => updateFilters({ priceMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rating Filter */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('rating')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-semibold text-gray-900">Rating</h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.rating ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.rating && (
                            <div className="p-3 bg-white">
                                <label className="text-xs text-gray-600 mb-1 block">Min Rating (0-5)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    max="5"
                                    step="0.5"
                                    value={filters.minRating || ''}
                                    onChange={(e) => updateFilters({ minRating: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>

                    {/* Stats Filter */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('stats')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-semibold text-gray-900">Statistiken</h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.stats ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.stats && (
                            <div className="p-3 space-y-3 bg-white">
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Views</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minViews || ''}
                                        onChange={(e) => updateFilters({ minViews: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Likes</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minLikes || ''}
                                        onChange={(e) => updateFilters({ minLikes: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Watchlist Count</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minWatchlistCount || ''}
                                        onChange={(e) => updateFilters({ minWatchlistCount: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Seltenheit */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('rarity')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-semibold text-gray-900">Seltenheit</h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.rarity ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.rarity && (
                            <div className="p-3 bg-white">
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_RARITIES.map((rarity) => (
                                        <button
                                            key={rarity}
                                            onClick={() => toggleRarity(rarity)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${filters.rarities.includes(rarity)
                                                ? getRarityColor(rarity)
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {rarity}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sortierung */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('sort')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-semibold text-gray-900">Sortierung</h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.sort ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.sort && (
                            <div className="p-3 space-y-2 bg-white">
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.field}
                                        onClick={() => updateSort(option.field)}
                                        className={`w-full px-4 py-2 rounded-lg text-left transition-all flex items-center justify-between ${currentSort.field === option.field
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {option.icon}
                                            <span className="text-sm">{option.label}</span>
                                        </span>
                                        {currentSort.field === option.field && (
                                            <span className="text-lg">
                                                {currentSort.direction === 'desc' ? '↓' : '↑'}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('search')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-semibold text-gray-900">Suche</h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.search ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.search && (
                            <div className="p-3 bg-white">
                                <input
                                    type="text"
                                    placeholder="NFT Name suchen..."
                                    value={filters.searchTerm || ''}
                                    onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
