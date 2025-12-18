"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { NFTFilters, NFTSortOptions } from '@/types/marketplace';

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
        searchTerm: '',
    });

    // Local search term for immediate UI update
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // Local numeric filters for debounced updates
    const [localNumericFilters, setLocalNumericFilters] = useState({
        priceMin: undefined as number | undefined,
        priceMax: undefined as number | undefined,
        minRating: undefined as number | undefined,
        minViews: undefined as number | undefined,
        minLikes: undefined as number | undefined,
        minWatchlistCount: undefined as number | undefined,
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
    });

    // Debounce search term updates (500ms delay)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters((prev: NFTFilters) => ({ ...prev, searchTerm: localSearchTerm }));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [localSearchTerm]);

    // Debounce numeric filter updates (500ms delay)
    // Memoize dependencies to prevent unnecessary re-renders
    const numericFiltersString = useMemo(
        () => JSON.stringify(localNumericFilters),
        [localNumericFilters]
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters((prev: NFTFilters) => ({
                ...prev,
                ...localNumericFilters
            }));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [numericFiltersString]); // Only depend on stringified version

    // Update parent when filters change (debounced for search and numeric inputs)
    // Use JSON.stringify to do deep comparison and avoid unnecessary calls
    const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

    useEffect(() => {
        onFiltersChange(filters);
    }, [filtersString]); // Only trigger when filter values actually change

    const updateFilters = (updates: Partial<NFTFilters>) => {
        const newFilters = { ...filters, ...updates };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const updateSort = (field: NFTSortOptions['field']) => {
        const newDirection = currentSort.field === field && currentSort.direction === 'desc' ? 'asc' as const : 'desc' as const;
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
            ? filters.categories.filter((c: string) => c !== category)
            : [...filters.categories, category];
        const newFilters = { ...filters, categories: newCategories };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const toggleRarity = (rarity: string) => {
        const newRarities = filters.rarities.includes(rarity)
            ? filters.rarities.filter((r: string) => r !== rarity)
            : [...filters.rarities, rarity];
        const newFilters = { ...filters, rarities: newRarities };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'epic': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'rare': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'uncommon': return 'bg-green-50 text-green-700 border-green-200';
            case 'common': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const activeFiltersCount = filters.categories.length + filters.rarities.length;

    // Sammle alle aktiven Filter als Chips
    const getActiveFilterChips = () => {
        const chips: { type: string; value: string; label: string }[] = [];

        // Kategorien
        filters.categories.forEach(cat => {
            chips.push({ type: 'category', value: cat, label: cat });
        });

        // Rarities
        filters.rarities.forEach(rarity => {
            chips.push({ type: 'rarity', value: rarity, label: rarity });
        });

        // Preis (nur anzeigen wenn tatsächlich Werte gesetzt)
        const hasPrice = (filters.priceMin !== undefined && filters.priceMin > 0) ||
            (filters.priceMax !== undefined && filters.priceMax > 0);
        if (hasPrice) {
            const min = filters.priceMin ?? 0;
            const max = filters.priceMax ?? '∞';
            chips.push({ type: 'price', value: 'price', label: `${min} - ${max} ETH` });
        }

        // Rating (nur anzeigen wenn > 0)
        if (filters.minRating !== undefined && filters.minRating > 0) {
            chips.push({ type: 'rating', value: 'rating', label: `≥ ${filters.minRating} ⭐` });
        }

        // Stats (nur anzeigen wenn > 0)
        if (filters.minViews !== undefined && filters.minViews > 0) {
            chips.push({ type: 'views', value: 'views', label: `≥ ${filters.minViews} Views` });
        }
        if (filters.minLikes !== undefined && filters.minLikes > 0) {
            chips.push({ type: 'likes', value: 'likes', label: `≥ ${filters.minLikes} Likes` });
        }
        if (filters.minWatchlistCount !== undefined && filters.minWatchlistCount > 0) {
            chips.push({ type: 'watchlist', value: 'watchlist', label: `≥ ${filters.minWatchlistCount} Watchlist` });
        }

        // Search
        if (filters.searchTerm) {
            chips.push({ type: 'search', value: 'search', label: `"${filters.searchTerm}"` });
        }

        return chips;
    };

    const removeFilterChip = (chip: { type: string; value: string }) => {
        switch (chip.type) {
            case 'category':
                toggleCategory(chip.value);
                break;
            case 'rarity':
                toggleRarity(chip.value);
                break;
            case 'price':
                setLocalNumericFilters(prev => ({ ...prev, priceMin: undefined, priceMax: undefined }));
                updateFilters({ priceMin: undefined, priceMax: undefined });
                break;
            case 'rating':
                setLocalNumericFilters(prev => ({ ...prev, minRating: undefined }));
                updateFilters({ minRating: undefined });
                break;
            case 'views':
                setLocalNumericFilters(prev => ({ ...prev, minViews: undefined }));
                updateFilters({ minViews: undefined });
                break;
            case 'likes':
                setLocalNumericFilters(prev => ({ ...prev, minLikes: undefined }));
                updateFilters({ minLikes: undefined });
                break;
            case 'watchlist':
                setLocalNumericFilters(prev => ({ ...prev, minWatchlistCount: undefined }));
                updateFilters({ minWatchlistCount: undefined });
                break;
            case 'search':
                setLocalSearchTerm('');
                updateFilters({ searchTerm: '' });
                break;
        }
    };

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

                        {/* Pfeil rotiert basierend auf tatsächlicher Sort Direction */}
                        {currentSort.field === option.field && (
                            <div
                                className="absolute top-1 left-1/2 -translate-x-1/2 transition-transform duration-500"
                                style={{
                                    transformOrigin: 'center 20px',
                                    transform: `translateX(-50%) rotate(${currentSort.direction === 'desc' ? 180 : 0}deg)`
                                }}
                            >
                                {/* Pfeil: desc=180°=▲, asc=0°=▼ */}
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
                    {/* Active Filter Chips */}
                    <div className="flex flex-wrap gap-2 items-start">
                        {getActiveFilterChips().map((chip, index) => {
                            // Get chip-specific styling
                            const getChipStyle = () => {
                                if (chip.type === 'rarity') {
                                    return getRarityColor(chip.value);
                                }
                                switch (chip.type) {
                                    case 'price':
                                        return 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100';
                                    case 'likes':
                                        return 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100';
                                    case 'views':
                                        return 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200';
                                    case 'rating':
                                        return 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100';
                                    case 'watchlist':
                                        return 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100';
                                    case 'search':
                                        return 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100';
                                    case 'category':
                                        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100';
                                    default:
                                        return 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100';
                                }
                            };

                            return (
                                <button
                                    key={`${chip.type}-${chip.value}-${index}`}
                                    onClick={() => removeFilterChip(chip)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-colors group flex-shrink-0 capitalize ${getChipStyle()}`}
                                >
                                    <span className="max-w-[120px] truncate">{chip.label}</span>
                                    <svg
                                        className="w-3 h-3 group-hover:opacity-70"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            );
                        })}
                        {getActiveFilterChips().length === 0 && (
                            <span className="text-xs text-gray-400 italic">Keine Filter aktiv</span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 pt-8 space-y-3">
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
                                        value={localNumericFilters.priceMin ?? ''}
                                        onChange={(e) => setLocalNumericFilters(prev => ({ ...prev, priceMin: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Max Preis (ETH)</label>
                                    <input
                                        type="number"
                                        placeholder="100.0"
                                        step="0.01"
                                        value={localNumericFilters.priceMax ?? ''}
                                        onChange={(e) => setLocalNumericFilters(prev => ({ ...prev, priceMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
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
                                    value={localNumericFilters.minRating ?? ''}
                                    onChange={(e) => setLocalNumericFilters(prev => ({ ...prev, minRating: e.target.value ? parseFloat(e.target.value) : undefined }))}
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
                                        value={localNumericFilters.minViews ?? ''}
                                        onChange={(e) => setLocalNumericFilters(prev => ({ ...prev, minViews: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Likes</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={localNumericFilters.minLikes ?? ''}
                                        onChange={(e) => setLocalNumericFilters(prev => ({ ...prev, minLikes: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min Watchlist Count</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={localNumericFilters.minWatchlistCount ?? ''}
                                        onChange={(e) => setLocalNumericFilters(prev => ({ ...prev, minWatchlistCount: e.target.value ? parseInt(e.target.value) : undefined }))}
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
                </div>
            </div>
        </>
    );
}
