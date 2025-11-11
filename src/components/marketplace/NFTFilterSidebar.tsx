"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { NFTFilters, NFTSortOptions } from './NFTFilterBar';

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
        collections: false,
        sort: false,
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

    // Öffne Panel bei Hover über Filter Button (nur Desktop)
    const handleFilterButtonMouseEnter = () => {
        // Nur auf Desktop (größer als md breakpoint)
        if (window.innerWidth >= 768) {
            setIsHovering(true);
            setIsOpen(true);
        }
    };

    const handleFilterButtonMouseLeave = () => {
        // Nur auf Desktop
        if (window.innerWidth >= 768) {
            setIsHovering(false);
            // Kleine Verzögerung bevor Panel schließt
            setTimeout(() => {
                setIsHovering(prev => {
                    if (!prev) setIsOpen(false);
                    return prev;
                });
            }, 300);
        }
    };

    const handlePanelMouseEnter = () => {
        if (window.innerWidth >= 768) {
            setIsHovering(true);
        }
    };

    const handlePanelMouseLeave = () => {
        if (window.innerWidth >= 768) {
            setIsHovering(false);
            setTimeout(() => {
                setIsHovering(prev => {
                    if (!prev) setIsOpen(false);
                    return prev;
                });
            }, 300);
        }
    };

    // Mobile: Nur auf Click
    const handleFilterButtonClick = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Icon-Strip Sidebar - Immer sichtbar (Desktop + Mobile) */}
            <div
                className="fixed left-0 top-[65px] bottom-0 w-16 bg-white border-r border-gray-200 z-[56] flex flex-col items-center pt-2 gap-3 overflow-y-auto"
            >
                {/* Filter Button - Öffnet die Sidebar (oben, mit gleichem Abstand wie links) */}
                <button
                    onClick={handleFilterButtonClick}
                    onMouseEnter={handleFilterButtonMouseEnter}
                    onMouseLeave={handleFilterButtonMouseLeave}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all relative"
                    title="Filter öffnen"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

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
                        title={`${option.label} ${currentSort.field === option.field ? (currentSort.direction === 'desc' ? '?' : '?') : ''}`}
                    >
                        {option.icon}

                        {/* Pfeil dreht sich wie Uhrzeiger um das Icon - rechts rum bei asc?desc, links rum bei desc?asc */}
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

                {/* Spacer - drückt alles nach oben, kein Icon unten mehr */}
                <div className="flex-1"></div>
            </div>

            {/* Slide-out Filter Panel - auf Mobile und Desktop */}
            <div
                className={`fixed left-[63px] top-[65px] bottom-0 w-80 bg-white z-[55] transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                onMouseEnter={handlePanelMouseEnter}
                onMouseLeave={handlePanelMouseLeave}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    {/* Disable Header Title for more compact design */}
                    {/*
                    <h3 className="text-sm font-bold text-gray-900">Filter & Sortierung</h3>
                    <p className="text-xs text-gray-600 mt-1">
                        {filteredCount} von {totalItems} NFTs
                    </p> 
                    */}
                    {/* Fixed height container to prevent layout shifts */}
                    <div className="h-6 flex items-center">
                        {activeFiltersCount > 0 ? (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-opacity"
                            >
                                Alle Filter zurücksetzen
                            </button>
                        ) : (
                            <span className="text-xs text-gray-500">
                                Keine Filter gesetzt
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 pt-8 space-y-3">
                    {/* Search - Ganz oben, immer sichtbar, kein Collapse */}
                    <div className="mb-4">
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">Suche</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="NFT Name suchen..."
                                value={filters.searchTerm || ''}
                                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                            />
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Divider nach Search */}
                    <div className="border-t border-gray-200"></div>

                    {/* Kategorien - Standardmäßig offen */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('categories')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
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

                    {/* Collections */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('collections')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                        >
                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                Collections
                            </h4>
                            <svg
                                className={`w-5 h-5 transition-transform ${expandedSections.collections ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSections.collections && (
                            <div className="p-3 space-y-2 bg-white">
                                <p className="text-xs text-gray-500 mb-3">Collection-Sortierung</p>

                                {/* Collection-spezifische Sortieroptionen */}
                                <button
                                    onClick={() => updateSort('price')}
                                    className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between border ${currentSort.field === 'price'
                                        ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                                        : 'bg-white/50 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white/80 hover:border-gray-300 hover:scale-[1.02] shadow-sm'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className={`w-5 h-5 ${currentSort.field === 'price' ? 'text-white' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm font-medium">Total Value</span>
                                    </span>
                                    {currentSort.field === 'price' && (
                                        <span className="text-lg">
                                            {currentSort.direction === 'desc' ? '?' : '?'}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => updateSort('created')}
                                    className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between border ${currentSort.field === 'created'
                                        ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                                        : 'bg-white/50 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white/80 hover:border-gray-300 hover:scale-[1.02] shadow-sm'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className={`w-5 h-5 ${currentSort.field === 'created' ? 'text-white' : 'text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <span className="text-sm font-medium">Total Supply</span>
                                    </span>
                                    {currentSort.field === 'created' && (
                                        <span className="text-lg">
                                            {currentSort.direction === 'desc' ? '?' : '?'}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => updateSort('rating')}
                                    className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between border ${currentSort.field === 'rating'
                                        ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                                        : 'bg-white/50 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white/80 hover:border-gray-300 hover:scale-[1.02] shadow-sm'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className={`w-5 h-5 ${currentSort.field === 'rating' ? 'text-white' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span className="text-sm font-medium">Listed</span>
                                    </span>
                                    {currentSort.field === 'rating' && (
                                        <span className="text-lg">
                                            {currentSort.direction === 'desc' ? '?' : '?'}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => updateSort('views')}
                                    className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between border ${currentSort.field === 'views'
                                        ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                                        : 'bg-white/50 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white/80 hover:border-gray-300 hover:scale-[1.02] shadow-sm'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className={`w-5 h-5 ${currentSort.field === 'views' ? 'text-white' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <span className="text-sm font-medium">Unlisted</span>
                                    </span>
                                    {currentSort.field === 'views' && (
                                        <span className="text-lg">
                                            {currentSort.direction === 'desc' ? '?' : '?'}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => updateSort('name')}
                                    className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between border ${currentSort.field === 'name'
                                        ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                                        : 'bg-white/50 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white/80 hover:border-gray-300 hover:scale-[1.02] shadow-sm'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className={`w-5 h-5 ${currentSort.field === 'name' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                        </svg>
                                        <span className="text-sm font-medium">Name</span>
                                    </span>
                                    {currentSort.field === 'name' && (
                                        <span className="text-lg">
                                            {currentSort.direction === 'desc' ? '?' : '?'}
                                        </span>
                                    )}
                                </button>                                {/* Divider */}
                                <div className="border-t border-gray-200 my-3"></div>

                                <p className="text-xs text-gray-500 mb-2">Collection Stats Filter</p>

                                {/* Min Supply Filter */}
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Supply</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={filters.minSupply || ''}
                                        onChange={(e) => updateFilters({ minSupply: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Min Listed Items Filter */}
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Listed Items</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={filters.minListedItems || ''}
                                        onChange={(e) => updateFilters({ minListedItems: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Min Floor Price Filter */}
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Floor Price (ETH)</label>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.01"
                                        min="0"
                                        value={filters.minFloorPrice || ''}
                                        onChange={(e) => updateFilters({ minFloorPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
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
                                                {currentSort.direction === 'desc' ? '?' : '?'}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
