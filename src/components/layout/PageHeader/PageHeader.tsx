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
 * BackButton - Navigation back link
 */
function BackButton({ href, label }: BackLink) {
    return (
        <Link
            href={href as Route}
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
            title={label}
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-medium">{label}</span>
        </Link>
    );
}

/**
 * Separator - Visual divider
 */
function Separator() {
    return <div className="w-px h-8 bg-gray-200 flex-shrink-0" />;
}

/**
 * IconBadge - Displays icon based on configuration
 */
function IconBadge({ type, svgContent, text, gradientFrom, gradientTo, customContent }: IconConfig) {
    const baseClasses = "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0";

    switch (type) {
        case 'svg':
            return (
                <div className={`${baseClasses} bg-gradient-to-br ${gradientFrom || 'from-blue-500'} ${gradientTo || 'to-purple-500'}`}>
                    {svgContent}
                </div>
            );

        case 'text-badge':
            return (
                <div className={`${baseClasses} bg-gradient-to-br ${gradientFrom || 'from-blue-500'} ${gradientTo || 'to-purple-500'}`}>
                    <span className="text-white font-semibold text-sm">
                        {text || '?'}
                    </span>
                </div>
            );

        case 'gradient-badge':
            return (
                <div className={`${baseClasses} bg-gradient-to-br ${gradientFrom || 'from-blue-500'} ${gradientTo || 'to-purple-500'}`}>
                    {svgContent || <span className="text-white font-semibold text-sm">{text || '?'}</span>}
                </div>
            );

        case 'custom':
            return <>{customContent}</>;

        default:
            return null;
    }
}

/**
 * TitleSection - Title and subtitle display with optional copy functionality
 */
function TitleSection({
    title,
    subtitle
}: {
    title: string;
    subtitle?: string | CopyableAddress;
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
            <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                    {title}
                </h1>
                <div className="flex items-center gap-1.5">
                    <p className="font-mono text-[11px] text-gray-600 truncate leading-tight">
                        {displayText}
                    </p>
                    <button
                        onClick={() => handleCopy(address)}
                        className="text-gray-500 hover:text-gray-900 transition-colors p-0.5 hover:bg-gray-100 rounded"
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
        <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                {title}
            </h1>
            {subtitle && (
                <p className="text-[11px] text-gray-500 truncate leading-tight">
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
    return (
        <div className={`fixed top-[66px] left-0 right-0 ${hasSidebar ? 'md:left-16' : ''} z-10 bg-white border-b border-gray-200 ${className}`}>
            <div className="px-8 py-2.5">
                <div className="flex items-center justify-between gap-8">
                    {/* Left Side - Navigation, Icon, Title */}
                    <div className="flex items-center gap-4 min-w-0">
                        <BackButton {...backLink} />
                        <Separator />
                        <div className="flex items-center gap-2.5">
                            <IconBadge {...icon} />
                            <TitleSection title={title} subtitle={subtitle} />
                        </div>
                    </div>

                    {/* Right Side - Stats or custom content */}
                    {rightContent && (
                        <div className="flex-1 max-w-2xl">
                            {rightContent}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
