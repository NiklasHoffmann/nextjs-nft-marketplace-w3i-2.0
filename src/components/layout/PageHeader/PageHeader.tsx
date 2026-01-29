/**
 * PageHeader Component
 * 
 * Unified header component for all pages with compact design.
 * Follows single responsibility principle and composition pattern.
 * 
 * Features:
 * - Fixed positioning with consistent spacing
 * - Back navigation with customizable link
 * - Icon/badge display (SVG or text badge)
 * - Title and subtitle with truncation
 * - Optional copyable address
 * - Flexible stat cards section
 * - Sidebar-aware positioning
 * 
 * @module components/layout/PageHeader
 */

"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useScrollPosition } from '@/hooks/useScrollPosition';

// ============================================================================
// Type Definitions
// ============================================================================

export type IconType = 'svg' | 'text-badge' | 'gradient-badge' | 'custom';

export interface BackLink {
    href: Route | string;
    label: string;
}

export interface IconConfig {
    type: IconType;
    /** SVG content for 'svg' type */
    svgContent?: ReactNode;
    /** Text content for 'text-badge' type */
    text?: string;
    /** Gradient colors for 'gradient-badge' type - defaults to blue-purple */
    gradientFrom?: string;
    gradientTo?: string;
    /** Custom component for 'custom' type */
    customContent?: ReactNode;
}

export interface CopyableAddress {
    address: string;
    displayFormat?: 'full' | 'short'; // short = 0x123...789
}

export interface PageHeaderProps {
    /** Back navigation configuration */
    backLink: BackLink;

    /** Icon/badge configuration */
    icon: IconConfig;

    /** Main title (required) */
    title: string;

    /** Optional subtitle or address */
    subtitle?: string | CopyableAddress;

    /** Optional stat cards or other content on the right side */
    rightContent?: ReactNode;

    /** Enable sidebar offset (for pages with left sidebar) */
    hasSidebar?: boolean;

    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Subcomponents (Single Responsibility)
// ============================================================================

/**
 * BackButton - Navigation back link with compact mode
 */
function BackButton({ href, label, isCompact }: BackLink & { isCompact: boolean }) {
    return (
        <Link
            href={href as Route}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-gray-500 hover:text-gray-900 transition-all duration-300 flex-shrink-0"
            title={label}
        >
            <svg
                className={`transition-all duration-300 ${isCompact ? 'w-4 h-4' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className={`text-[11px] sm:text-xs font-medium truncate max-w-[80px] sm:max-w-none transition-all duration-300 ${isCompact ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>
                {label}
            </span>
        </Link>
    );
}

/**
 * Separator - Visual divider
 */
function Separator() {
    return <div className="hidden md:block w-px h-8 bg-gray-200 flex-shrink-0" />;
}

/**
 * IconBadge - Displays icon based on configuration with size transition
 */
function IconBadge({ type, svgContent, text, gradientFrom, gradientTo, customContent, isCompact }: IconConfig & { isCompact: boolean }) {
    const baseClasses = `rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isCompact ? 'w-7 h-7' : 'w-9 h-9'
        }`;

    switch (type) {
        case 'svg':
            return (
                <div className={`${baseClasses} bg-gradient-to-br ${gradientFrom || 'from-blue-500'} ${gradientTo || 'to-purple-500'}`}>
                    <div className={`transition-all ${isCompact ? 'scale-75' : 'scale-100'}`}>
                        {svgContent}
                    </div>
                </div>
            );

        case 'text-badge':
            return (
                <div className={`${baseClasses} bg-gradient-to-br ${gradientFrom || 'from-blue-500'} ${gradientTo || 'to-purple-500'}`}>
                    <span className={`text-white font-semibold transition-all ${isCompact ? 'text-xs' : 'text-sm'}`}>
                        {text || '?'}
                    </span>
                </div>
            );

        case 'gradient-badge':
            return (
                <div className={`${baseClasses} bg-gradient-to-br ${gradientFrom || 'from-blue-500'} ${gradientTo || 'to-purple-500'}`}>
                    <div className={`transition-all ${isCompact ? 'scale-75' : 'scale-100'}`}>
                        {svgContent || <span className="text-white font-semibold text-sm">{text || '?'}</span>}
                    </div>
                </div>
            );

        case 'custom':
            return <>{customContent}</>;

        default:
            return null;
    }
}

/**
 * TitleSection - Title and subtitle display with compact mode
 */
function TitleSection({
    title,
    subtitle,
    isCompact
}: {
    title: string;
    subtitle?: string | CopyableAddress;
    isCompact: boolean;
}) {
    const handleCopy = (address: string) => {
        navigator.clipboard.writeText(address);
    };

    const isCopyableAddress = typeof subtitle === 'object' && subtitle !== null && 'address' in subtitle;

    if (isCopyableAddress) {
        const { address, displayFormat = 'short' } = subtitle;
        const displayText = displayFormat === 'short'
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : address;

        return (
            <div className="min-w-0 flex-1">
                <h1 className={`font-bold text-gray-900 leading-tight truncate transition-all duration-300 ${isCompact ? 'text-sm' : 'text-base sm:text-lg'
                    }`}>
                    {title}
                </h1>
                <div className={`flex items-center gap-1.5 transition-all duration-300 ${isCompact ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'
                    }`}>
                    <p className="font-mono text-[10px] sm:text-[11px] text-gray-600 truncate leading-tight">
                        {displayText}
                    </p>
                    <button
                        onClick={() => handleCopy(address)}
                        className="text-gray-500 hover:text-gray-900 transition-colors p-0.5 hover:bg-gray-100 rounded flex-shrink-0"
                        title="Copy Address"
                        aria-label="Copy address"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-0 flex-1">
            <h1 className={`font-bold text-gray-900 leading-tight truncate transition-all ${isCompact ? 'text-sm' : 'text-base sm:text-lg'
                }`}>
                {title}
            </h1>
            {subtitle && (
                <p className={`text-[10px] sm:text-[11px] text-gray-500 truncate leading-tight transition-all ${isCompact ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'
                    }`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PageHeader - Main unified header component
 * 
 * Usage Examples:
 * 
 * 1. Wallet Page:
 * ```tsx
 * <PageHeader
 *   backLink={{ href: "/marketplace", label: "Back to Marketplace" }}
 *   icon={{
 *     type: "svg",
 *     svgContent: <WalletIcon />,
 *     gradientFrom: "from-green-500",
 *     gradientTo: "to-emerald-600"
 *   }}
 *   title="My Wallet"
 *   subtitle={{ address: "0x123...", displayFormat: "short" }}
 *   rightContent={<WalletStats {...stats} />}
 * />
 * ```
 * 
 * 2. Collection Page:
 * ```tsx
 * <PageHeader
 *   backLink={{ href: "/marketplace", label: "Back to Marketplace" }}
 *   icon={{
 *     type: "svg",
 *     svgContent: <CollectionIcon />
 *   }}
 *   title="Cool NFT Collection"
 *   subtitle={{ address: contractAddress, displayFormat: "short" }}
 *   rightContent={<CollectionStats {...stats} />}
 *   hasSidebar
 * />
 * ```
 * 
 * 3. NFT Detail Page:
 * ```tsx
 * <PageHeader
 *   backLink={{ href: "/marketplace", label: "Back to Marketplace" }}
 *   icon={{
 *     type: "text-badge",
 *     text: contractSymbol
 *   }}
 *   title="Ape #1234"
 *   subtitle="Bored Ape Yacht Club"
 *   rightContent={<NFTInteractionCards {...interactions} />}
 * />
 * ```
 */
export function PageHeader({
    backLink,
    icon,
    title,
    subtitle,
    rightContent,
    hasSidebar = false,
    className = ''
}: PageHeaderProps) {
    // Detect scroll position for compact mode
    const isScrolled = useScrollPosition(80);

    return (
        <div className={`fixed top-[66px] left-0 right-0 ${hasSidebar ? 'md:left-16' : ''} z-10 bg-white border-b border-gray-200 transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''
            } ${className}`}>
            <div className={`px-4 sm:px-6 md:px-8 transition-all duration-300 ${isScrolled ? 'py-1.5 md:py-1.5' : 'py-3 md:py-2.5'
                }`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8">
                    {/* Left Side - Navigation, Icon, Title */}
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 md:flex-initial">
                        <BackButton href={backLink.href} label={backLink.label} isCompact={isScrolled} />
                        <Separator />
                        <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-1">
                            <IconBadge
                                type={icon.type}
                                svgContent={icon.svgContent}
                                text={icon.text}
                                gradientFrom={icon.gradientFrom}
                                gradientTo={icon.gradientTo}
                                customContent={icon.customContent}
                                isCompact={isScrolled}
                            />
                            <TitleSection title={title} subtitle={subtitle} isCompact={isScrolled} />
                        </div>
                    </div>

                    {/* Right Side - Stats with compact mode */}
                    {rightContent && (
                        <div className={`w-full md:flex-1 md:max-w-2xl transition-all duration-300 ${isScrolled ? 'transform scale-90 origin-right' : ''
                            }`}>
                            {React.cloneElement(rightContent as React.ReactElement, { isCompact: isScrolled })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
