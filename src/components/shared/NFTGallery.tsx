'use client'

// NFTGallery - Dynamic NFT Display Component
// Supports both horizontal scrolling and grid layout with ScrollButtons
// Used by: ListedNFTsList, CollectionPageClient, WalletNFTsList

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { LazyNFTCard, NFTCard } from '@/components/nft'
import { BaseCard } from '@/components/core/Card/BaseCard'
import { ScrollButtons } from '@/components/ui/ScrollButtons'
import { EmptyState } from '@/components/core/Empty'
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
    actions,
    defaultGridView = false
}: NFTScrollListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isGridView, setIsGridView] = useState(defaultGridView)

    const cardContainerClassName = `flex-shrink-0 ${cardWidth} relative`

    const getCardKey = useCallback((item: NFTScrollItem, index: number) => {
        return item.listingId
            ? `listing-${item.listingId}`
            : `${item.contractAddress}-${item.tokenId}-${index}`
    }, [])

    const buildCardProps = useCallback((item: NFTScrollItem, cardPriority: boolean) => ({
        contractAddress: item.contractAddress,
        tokenId: item.tokenId,
        price: item.price as string | undefined,
        isListed: item.isListed,
        listingId: item.listingId,
        seller: item.seller,
        buyer: item.buyer,
        desiredContractAddress: item.desiredContractAddress,
        desiredTokenId: item.desiredTokenId,
        currency: item.currency,
        chainId: item.chainId,
        listingType: item.listingType,
        tokenStandard: item.tokenStandard,
        erc1155QuantityListed: item.erc1155QuantityListed,
        remainingQuantity: item.remainingQuantity,
        unitPrice: item.unitPrice,
        partialBuyEnabled: item.partialBuyEnabled,
        enableInsights,
        showStats,
        priority: cardPriority,
        metadata: item.metadata,
        insights: item.insights,
        contract: item.contract
    }), [enableInsights, showStats])



    const renderCardShell = useCallback((cardBody: React.ReactNode, item: NFTScrollItem) => {
        return (
            <div className={cardContainerClassName}>
                {cardBody}

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
    }, [cardContainerClassName, badge, secondaryBadge])

    const renderCardWrapper = useCallback((cardContent: React.ReactNode, item: NFTScrollItem) => {
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

        return (
            <div
                onClick={onCardClick ? () => onCardClick(item) : undefined}
                className={onCardClick ? 'cursor-pointer' : ''}
            >
                {cardContent}
            </div>
        )
    }, [enableLinks, linkBuilder, onCardClick])

    // Render card content - memoized to prevent unnecessary re-renders
    // MUST be declared before any conditional returns (Rules of Hooks)
    const renderCard = useCallback((item: NFTScrollItem, index: number, cardBody?: React.ReactNode) => {
        const cardProps = buildCardProps(item, priority || index < 4)
        const content = renderCardShell(
            cardBody || <NFTCard {...cardProps} />,
            item
        )

        return renderCardWrapper(content, item)
    }, [buildCardProps, renderCardShell, renderCardWrapper, priority])

    // Scroll functions
    const updateScrollButtons = useCallback(() => {
        if (!scrollContainerRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }, [])

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
    }, [items, updateScrollButtons])

    // Add scroll event listener
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        container.addEventListener('scroll', updateScrollButtons)
        return () => container.removeEventListener('scroll', updateScrollButtons)
    }, [items, updateScrollButtons])

    // Loading state - Match NFTCard dimensions with proper aspect ratio
    if (loading) {
        return (
            <div className={className}>
                {title && (
                    largeTitle ? (
                        <h1 className="text-3xl font-bold text-gray-900 mb-4 pl-8">{title}</h1>
                    ) : (
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
                    )
                )}
                {subtitle && (
                    <p className="text-sm text-gray-600 mb-4 pl-8">{subtitle}</p>
                )}
                <div className={`flex ${gap} ${padding} pl-8 overflow-hidden`}>
                    {Array.from({ length: loadingCount }).map((_, i) => (
                        <div key={i} className={`flex-shrink-0 ${cardWidth}`}>
                            {/* Match NFTCard's exact structure - h-72, border, rounded-lg outer container */}
                            <div className="w-full h-72 rounded-lg shadow-xl border border-black bg-gray-200 relative">
                                {/* Inner content container with inset-2 (matches NFTCard structure) */}
                                <div className="absolute inset-2 shadow-lg rounded-md overflow-hidden bg-white">
                                    <div className="w-full h-full p-1 flex flex-col gap-1 animate-pulse">
                                        {/* Header placeholder */}
                                        <div className="flex-shrink-0 h-8">
                                            <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                                            <div className="h-2 bg-gray-200 rounded w-1/2" />
                                        </div>

                                        {/* Image/Description area */}
                                        <div className="flex-1 min-h-0 bg-gray-200 rounded-md" />

                                        {/* Footer placeholder */}
                                        <div className="flex-shrink-0 h-6 flex gap-1">
                                            <div className="h-5 bg-gray-200 rounded w-16" />
                                            <div className="h-5 bg-gray-200 rounded w-12" />
                                        </div>

                                        {/* Price placeholder */}
                                        <div className="flex-shrink-0 h-8">
                                            <div className="h-6 bg-gray-200 rounded w-24" />
                                        </div>
                                    </div>
                                </div>
                            </div>
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
            <div className={className}>
                <EmptyState
                    icon="🖼️"
                    title="No NFTs"
                    description={emptyMessage}
                    size="sm"
                />
            </div>
        )
    }

    return (
        <div className={`${className} transition-all duration-200`}>
            {/* Title Row - Title (left) + Actions (right) */}
            {(title || actions) && (
                <div className="flex items-center justify-between mb-2 pl-8 pr-8">
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

            {/* Subtitle Row - Always rendered to prevent layout shift, min-height reserves space */}
            {(subtitle || enableViewAll) && (
                <div className="flex items-center justify-between mb-4 pl-8 pr-8 min-h-[1.75rem]">
                    <div className="text-sm text-gray-600">
                        {subtitle || '\u00A0'}
                    </div>
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
                        const cardProps = buildCardProps(item, priority || index < 6)
                        const cardContent = renderCardShell(
                            <LazyNFTCard {...cardProps} />,
                            item
                        )

                        return (
                            <React.Fragment key={getCardKey(item, index)}>
                                {renderCardWrapper(cardContent, item)}
                            </React.Fragment>
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
                        {items.map((item, index) => (
                            <React.Fragment key={getCardKey(item, index)}>
                                {renderCard(item, index)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
