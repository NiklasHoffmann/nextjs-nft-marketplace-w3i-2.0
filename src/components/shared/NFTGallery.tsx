'use client'

// NFTGallery - Dynamic NFT Display Component
// Supports both horizontal scrolling and grid layout with ScrollButtons
// Used by: ListedNFTsList, CollectionPageClient, WalletNFTsList

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { LazyNFTCard, NFTCard } from '@/components/nft'
import { BaseCard } from '@/components/core/Card/BaseCard'
import { ScrollButtons } from '@/components/ui/ScrollButtons'
import type { NFTScrollItem, NFTScrollListProps } from '@/types/marketplace'

export function NFTGallery({
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
    linkBuilder = (item) => `/nft/${item.contractAddress}/${item.tokenId}`,
    onCardClick,
    enableViewAll = false,
    gridColumns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    headerContent,
    largeTitle = false,
    subtitle,
    actions
}: NFTScrollListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isGridView, setIsGridView] = useState(false)



    // Render card content - memoized to prevent unnecessary re-renders
    // MUST be declared before any conditional returns (Rules of Hooks)
    const renderCard = useCallback((item: NFTScrollItem) => {
        const cardContent = (
            <div className={`flex-shrink-0 ${cardWidth} relative`}>
                <NFTCard
                    contractAddress={item.contractAddress}
                    tokenId={item.tokenId}
                    price={item.price as string | undefined}
                    isListed={item.isListed}
                    listingId={item.listingId}
                    seller={item.seller}
                    buyer={item.buyer}
                    desiredContractAddress={item.desiredContractAddress}
                    desiredTokenId={item.desiredTokenId}
                    enableInsights={enableInsights}
                    showStats={showStats}
                    priority={priority}
                    // Pass MongoDB-optimized data (prevents API calls!)
                    metadata={item.metadata}
                    insights={item.insights}
                    contract={item.contract}
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
                onClick={onCardClick ? () => onCardClick(item) : undefined}
                className={onCardClick ? 'cursor-pointer' : ''}
            >
                {cardContent}
            </div>
        )
    }, [cardWidth, enableInsights, showStats, priority, badge, secondaryBadge, enableLinks, linkBuilder, onCardClick])

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

    // Loading state - Show accurate NFTCardSkeleton
    if (loading) {
        return (
            <div className={className}>
                {title && (
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
                )}
                <div className={`flex ${gap} ${padding} overflow-hidden`}>
                    {Array.from({ length: loadingCount }).map((_, i) => (
                        <div key={i} className={`flex-shrink-0 ${cardWidth}`}>
                            <BaseCard loading={true} size="md" />
                        </div>
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

    return (
        <div className={`${className} transition-all duration-200`}>
            {/* Title Row - Title (left) + Actions (right) */}
            {(title || actions) && (
                <div className="flex items-center justify-between mb-2 mx-8">
                    {title && (
                        largeTitle ? (
                            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                        ) : (
                            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                        )
                    )}
                    {actions && <div>{actions}</div>}
                </div>
            )}

            {/* Subtitle Row - Subtitle/Stats (left) + View All Button (right) */}
            {(subtitle || enableViewAll) && (
                <div className="flex items-center justify-between mb-4 mx-8">
                    {subtitle && (
                        <div className="text-sm text-gray-600">
                            {subtitle}
                        </div>
                    )}
                    {enableViewAll && (
                        <button
                            onClick={() => setIsGridView(!isGridView)}
                            disabled={items.length === 0}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${items.length === 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                }`}
                        >
                            {isGridView ? (
                                <>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    Scroll View
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    View All
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Optional header content (deprecated, use subtitle + actions instead) */}
            {headerContent}

            {/* Grid View */}
            {isGridView ? (
                <div 
                    className={`grid ${gridColumns} ${gap} ${padding} pl-8 min-h-[288px]`}
                    style={{ paddingBottom: '50px' }} // Space for hover shadows (same as scroll view)
                >
                    {items.map((item, index) => {
                        const cardContent = (
                            <div className={`flex-shrink-0 ${cardWidth} relative`}>
                                <LazyNFTCard
                                    contractAddress={item.contractAddress}
                                    tokenId={item.tokenId}
                                    price={item.price as string | undefined}
                                    isListed={item.isListed}
                                    listingId={item.listingId}
                                    seller={item.seller}
                                    buyer={item.buyer}
                                    desiredContractAddress={item.desiredContractAddress}
                                    desiredTokenId={item.desiredTokenId}
                                    enableInsights={enableInsights}
                                    showStats={showStats}
                                    priority={priority}
                                    // Pass MongoDB-optimized data (prevents API calls!)
                                    metadata={item.metadata}
                                    insights={item.insights}
                                    contract={item.contract}
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
                                    key={item.listingId || `${item.contractAddress}-${item.tokenId}-${item.seller || 'unlisted'}`}
                                    href={linkBuilder(item) as any}
                                    onClick={onCardClick ? () => onCardClick(item) : undefined}
                                >
                                    {cardContent}
                                </Link>
                            )
                        }

                        return (
                            <div
                                key={item.listingId || `${item.contractAddress}-${item.tokenId}-${item.seller || 'unlisted'}`}
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
                <div className="relative overflow-visible min-h-[288px]">
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
                        className={`flex ${gap} overflow-x-auto snap-x snap-mandatory scroll-smooth ${padding} pl-8`}
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            overflowY: 'visible',
                            paddingBottom: '50px' // Space for hover shadows
                        }}
                    >
                        {items.map((item) => (
                            <React.Fragment key={item.listingId || `${item.contractAddress}-${item.tokenId}-${item.seller || 'unlisted'}`}>
                                {renderCard(item)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
