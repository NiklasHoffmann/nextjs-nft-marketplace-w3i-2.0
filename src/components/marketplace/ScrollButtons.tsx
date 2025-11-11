'use client'

// Reusable Scroll Buttons Component
// Zeigt glassmorphische Scroll-Buttons mit Lightbulb-Icon
// Verwendet von: ActiveItemsList, CollectionPageClient, CollectionsTable

import React from 'react'
import Image from 'next/image'

interface ScrollButtonsProps {
    canScrollLeft: boolean
    canScrollRight: boolean
    onScrollLeft: () => void
    onScrollRight: () => void
    className?: string
}

export function ScrollButtons({
    canScrollLeft,
    canScrollRight,
    onScrollLeft,
    onScrollRight,
    className = ''
}: ScrollButtonsProps) {
    return (
        <>
            {/* Left Scroll Button - Overlay - Hidden on Mobile */}
            {canScrollLeft && (
                <button
                    onClick={onScrollLeft}
                    className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 hover:scale-105 transition-all duration-200 group border border-gray-200 ${className}`}
                    aria-label="Nach links scrollen"
                >
                    {/* Pfeil links */}
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {/* Lightbulb Icon - 270Â° nach links leuchtend */}
                    <div className="group-hover:drop-shadow-[0_0_16px_rgba(255,215,0,1)] transition-all duration-200">
                        <Image
                            src="/media/only-lightbulb.png"
                            alt="Lightbulb"
                            width={24}
                            height={24}
                            className="group-hover:scale-110 transition-transform duration-200"
                            style={{ transform: 'rotate(270deg)' }}
                            priority
                        />
                    </div>
                </button>
            )}

            {/* Right Scroll Button - Overlay - Hidden on Mobile */}
            {canScrollRight && (
                <button
                    onClick={onScrollRight}
                    className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 hover:scale-105 transition-all duration-200 group border border-gray-200 ${className}`}
                    aria-label="Nach rechts scrollen"
                >
                    {/* Lightbulb Icon - 90Â° nach rechts leuchtend */}
                    <div className="group-hover:drop-shadow-[0_0_16px_rgba(255,215,0,1)] transition-all duration-200">
                        <Image
                            src="/media/only-lightbulb.png"
                            alt="Lightbulb"
                            width={24}
                            height={24}
                            className="group-hover:scale-110 transition-transform duration-200"
                            style={{ transform: 'rotate(90deg)' }}
                            priority
                        />
                    </div>
                    {/* Pfeil rechts */}
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
        </>
    )
}
