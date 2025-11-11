'use client'

// NFTScrollList - Dynamic Reusable Component
// Horizontales Scrolling mit ScrollButtons, konsistenten Card-Dimensionen (w-60, gap-6)
// Verwendet von: ActiveItemsList, CollectionPageClient, WalletNFTsList

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { NFTCard } from '@/components/nft/NFTCard'
import { ScrollButtons } from './ScrollButtons'

export interface NFTScrollItem {
    nftAddress: string
    tokenId: string
    price?: string | bigint
    isListed?: boolean
    listingId?: string
    seller?: string
    buyer?: string
    desiredNftAddress?: string
    desiredTokenId?: string
    [key: string]: any // Allow additional properties
}

export interface NFTScrollListProps {
    /** Array of NFT items to display */
    items: NFTScrollItem[]
    /** Optional title for the section */
    title?: string
    /** Badge to show on each card (e.g., "Listed", "Not Listed") */
    badge?: {
        text: string
        color: string // Tailwind classes like 'bg-green-500'
    }
    /** Additional badge (top-left corner) */
    secondaryBadge?: (item: NFTScrollItem) => React.ReactNode
    /** Enable NFT Card insights */
    enableInsights?: boolean
    /** Show stats on cards */
    showStats?: boolean
    /** Priority loading for images */
    priority?: boolean
    /** Empty state message */
    emptyMessage?: string
    /** Custom empty state component */
    emptyComponent?: React.ReactNode
    /** Loading state */
    loading?: boolean
    /** Number of skeleton cards to show when loading */
    loadingCount?: number
    /** Additional className for the container */
    className?: string
    /** Custom card width (default: w-60) */
    cardWidth?: string
    /** Custom gap (default: gap-6) */
    gap?: string
    /** Custom padding (default: p-4) */
    padding?: string
    /** Show card links (wrap in Link component) */
    enableLinks?: boolean
    /** Custom link builder */
    linkBuilder?: (item: NFTScrollItem) => string
    /** Callback when a card is clicked */
    onCardClick?: (item: NFTScrollItem) => void
    /** Enable "View All" button to toggle grid view */
    enableViewAll?: boolean
    /** Grid columns for "View All" mode (default: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5) */
    gridColumns?: string
}

export function NFTScrollList({
    items,
    title,
    badge,
    secondaryBadge,
    enableInsights = true,
    showStats = true,
    priority = false,
    emptyMessage = 'No NFTs found',
    emptyComponent,
    loading = false,
    loadingCount = 8,
    className = '',
    cardWidth = 'w-60',
    gap = 'gap-6',
    padding = 'p-4',
    enableLinks = true,
    linkBuilder = (item) => `/nft/${item.nftAddress}/${item.tokenId}`,
    onCardClick,
    enableViewAll = false,
    gridColumns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
}: NFTScrollListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isGridView, setIsGridView] = useState(false)

    // Scroll functions
    const updateScrollButtons = () => {
        if (!scrollContainerRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        // Calculate scroll amount based on card width and gap
        // w-60 = 240px, gap-6 = 24px -> 264px per card
        // 3 cards: 264px × 3 = 792px
        const scrollAmount = 792
        const newScrollLeft = direction === 'left'
            ? scrollContainerRef.current.scrollLeft - scrollAmount
            : scrollContainerRef.current.scrollLeft + scrollAmount
        scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
    }

    // Update scroll buttons when items change
    useEffect(() => {
        const timer = setTimeout(updateScrollButtons, 100)
        return () => clearTimeout(timer)
    }, [items])

    // Add scroll event listener
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        container.addEventListener('scroll', updateScrollButtons)
        return () => container.removeEventListener('scroll', updateScrollButtons)
    }, [items])

    // Loading state
    if (loading && items.length === 0) {
        return (
            <div className={className}>
                {title && (
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
                )}
                <div className={`flex ${gap} ${padding} overflow-hidden`}>
                    {Array.from({ length: loadingCount }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex-shrink-0 ${cardWidth} bg-gray-200 rounded-xl aspect-square animate-pulse`}
                        />
                    ))}
                </div>
            </div>
        )
    }

    // Empty state
    if (items.length === 0) {
        if (emptyComponent) {
            return <>{emptyComponent}</>
        }

        return (
            <div className={`text-center py-12 bg-gray-50 rounded-lg ${className}`}>
                <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        )
    }

    // Render card content
    const renderCard = (item: NFTScrollItem) => {
        const cardContent = (
            <div className={`flex-shrink-0 ${cardWidth} relative`}>
                <NFTCard
                    contractAddress={item.nftAddress}
                    tokenId={item.tokenId}
                    price={item.price as string | undefined}
                    isListed={item.isListed}
                    listingId={item.listingId}
                    seller={item.seller}
                    buyer={item.buyer}
                    desiredNftAddress={item.desiredNftAddress}
                    desiredTokenId={item.desiredTokenId}
                    enableInsights={enableInsights}
                    showStats={showStats}
                    priority={priority}
                />

                {/* Primary Badge (Top Right) */}
                {badge && (
                    <div className="absolute top-2 right-2 z-10">
                        <span className={`${badge.color} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
                            {badge.text}
                        </span>
                    </div>
                )}

                {/* Secondary Badge (Top Left) */}
                {secondaryBadge && (
                    <div className="absolute top-2 left-2 z-10">
                        {secondaryBadge(item)}
                    </div>
                )}
            </div>
        )

        // Wrap in Link if enabled
        if (enableLinks) {
            return (
                <Link
                    key={`${item.nftAddress}-${item.tokenId}`}
                    href={linkBuilder(item) as any}
                    onClick={onCardClick ? () => onCardClick(item) : undefined}
                >
                    {cardContent}
                </Link>
            )
        }

        // Without link
        return (
            <div
                key={`${item.nftAddress}-${item.tokenId}`}
                onClick={onCardClick ? () => onCardClick(item) : undefined}
                className={onCardClick ? 'cursor-pointer' : ''}
            >
                {cardContent}
            </div>
        )
    }

    return (
        <div className={className}>
            {/* Title and View Toggle */}
            <div className="flex items-center justify-between mb-4">
                {title && (
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                )}
                {enableViewAll && items.length > 0 && (
                    <button
                        onClick={() => setIsGridView(!isGridView)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        {isGridView ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                Scroll View
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                View All
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Grid View */}
            {isGridView ? (
                <div className={`grid ${gridColumns} ${gap} ${padding}`}>
                    {items.map((item) => {
                        const cardContent = (
                            <div className={`flex-shrink-0 ${cardWidth} relative`}>
                                <NFTCard
                                    contractAddress={item.nftAddress}
                                    tokenId={item.tokenId}
                                    price={item.price as string | undefined}
                                    isListed={item.isListed}
                                    listingId={item.listingId}
                                    seller={item.seller}
                                    buyer={item.buyer}
                                    desiredNftAddress={item.desiredNftAddress}
                                    desiredTokenId={item.desiredTokenId}
                                    enableInsights={enableInsights}
                                    showStats={showStats}
                                    priority={priority}
                                />

                                {/* Primary Badge (Top Right) */}
                                {badge && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <span className={`${badge.color} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
                                            {badge.text}
                                        </span>
                                    </div>
                                )}

                                {/* Secondary Badge (Top Left) */}
                                {secondaryBadge && (
                                    <div className="absolute top-2 left-2 z-10">
                                        {secondaryBadge(item)}
                                    </div>
                                )}
                            </div>
                        )

                        if (enableLinks) {
                            return (
                                <Link
                                    key={`${item.nftAddress}-${item.tokenId}`}
                                    href={linkBuilder(item) as any}
                                    onClick={onCardClick ? () => onCardClick(item) : undefined}
                                >
                                    {cardContent}
                                </Link>
                            )
                        }

                        return (
                            <div
                                key={`${item.nftAddress}-${item.tokenId}`}
                                onClick={onCardClick ? () => onCardClick(item) : undefined}
                                className={onCardClick ? 'cursor-pointer' : ''}
                            >
                                {cardContent}
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* Scroll View */
                <div className="relative overflow-visible">
                    {/* Scroll Buttons */}
                    <ScrollButtons
                        canScrollLeft={canScrollLeft}
                        canScrollRight={canScrollRight}
                        onScrollLeft={() => scroll('left')}
                        onScrollRight={() => scroll('right')}
                    />

                    {/* Horizontal Scroll Container */}
                    <div
                        ref={scrollContainerRef}
                        className={`flex ${gap} overflow-x-auto snap-x snap-mandatory scroll-smooth ${padding}`}
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            overflowY: 'visible',
                            paddingBottom: '50px' // Space for hover shadows
                        }}
                    >
                        {items.map(renderCard)}
                    </div>
                </div>
            )}
        </div>
    )
}
