/**
 * StatCard Component (USING BaseCard)
 * 
 * Matches design from /nft/[contractAddress] collection header.
 * Clean card design with icon badge, label, and bold value.
 * Now using BaseCard infrastructure with custom styling.
 * 
 * Features:
 * - Responsive compact mode for scrolling headers
 * - Accessibility support with ARIA labels
 * - Consistent sizing and alignment
 */
"use client";

import React from 'react';
import { BaseCard } from '@/components/core/Card';

type StatVariant = 'green' | 'gray' | 'purple' | 'blue' | 'red' | 'yellow';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string | React.ReactNode;
    secondaryValue?: string;
    variant: StatVariant;
    hideSecondaryPlaceholder?: boolean;
    isCompact?: boolean;
}

// Constants for consistent sizing
const COMPACT_HEIGHT = 'h-12'; // 48px
const COMPACT_FONT_SIZE = 'text-base';
const NORMAL_FONT_SIZE = 'text-xl';

const variantStyles: Record<StatVariant, { iconBg: string; textColor: string; cardBg?: string; cardBorder?: string }> = {
    green: { iconBg: 'bg-green-100', textColor: 'text-green-600' },
    gray: { iconBg: 'bg-gray-100', textColor: 'text-gray-600' },
    purple: { iconBg: 'bg-purple-100', textColor: 'text-purple-600' },
    blue: { iconBg: 'bg-blue-100', textColor: 'text-blue-600', cardBg: 'bg-blue-50', cardBorder: 'border-blue-200' },
    red: { iconBg: 'bg-red-100', textColor: 'text-red-600', cardBg: 'bg-red-50', cardBorder: 'border-red-200' },
    yellow: { iconBg: 'bg-yellow-100', textColor: 'text-yellow-600', cardBg: 'bg-yellow-50', cardBorder: 'border-yellow-200' }
};

// Type guard for React nodes
function isReactNodeValue(value: number | string | React.ReactNode): value is React.ReactNode {
    return typeof value !== 'string' && typeof value !== 'number';
}

// Helper component for rendering value
function StatValue({ 
    value, 
    textColor, 
    fontSize, 
    className = '' 
}: { 
    value: number | string | React.ReactNode; 
    textColor: string; 
    fontSize: string;
    className?: string;
}) {
    if (isReactNodeValue(value)) {
        return (
            <div className={`${textColor} ${fontSize} font-bold ${className}`}>
                {value}
            </div>
        );
    }
    
    return (
        <div 
            className={`${fontSize} font-bold ${textColor} truncate ${className}`} 
            title={String(value)}
        >
            {value}
        </div>
    );
}

export function StatCard({ icon, label, value, secondaryValue, variant, hideSecondaryPlaceholder = false, isCompact = false }: StatCardProps) {
    const styles = variantStyles[variant];
    const displayValue = typeof value === 'number' || typeof value === 'string' ? `${label}: ${value}` : label;

    // Compact mode uses direct rendering for precise grid control
    if (isCompact) {
        return (
            <div
                className={`
                    ${COMPACT_HEIGHT} min-w-[120px]
                    bg-white border border-gray-200 rounded-xl shadow-sm
                    ${styles.cardBg || ''} ${styles.cardBorder ? styles.cardBorder : ''}
                    hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.4)] hover:scale-[1.02]
                    transition-all duration-300
                    cursor-pointer
                    overflow-hidden
                    flex items-center
                    px-3
                `}
                aria-label={displayValue}
                title={displayValue}
            >
                <div className="flex items-center gap-3 h-12 w-full">
                    {/* Icon - fixed size */}
                    <div className={`${styles.iconBg} rounded-lg p-1.5 flex-shrink-0`}>
                        {icon}
                    </div>
                    {/* Value - flexible, centered */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className={`${COMPACT_FONT_SIZE} font-bold ${styles.textColor} leading-none`}>
                            {value}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Normal mode uses BaseCard
    return (
        <BaseCard
            size="sm"
            hoverable
            border="default"
            shadow="sm"
            rounded="lg"
            className={`w-full h-full flex flex-col ${styles.cardBg || ''} ${styles.cardBorder ? `border ${styles.cardBorder}` : ''}`}
            padding="p-2.5"
            content={
                <>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className={`${styles.iconBg} rounded-md p-1`}>
                            {icon}
                        </div>
                        <span className="text-[10px] font-medium text-gray-600">{label}</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center items-start">
                        <StatValue 
                            value={value}
                            textColor={styles.textColor}
                            fontSize="text-base"
                            className="w-full text-left"
                        />
                        {!hideSecondaryPlaceholder && (
                            secondaryValue ? (
                                <p className="text-[10px] text-gray-500 truncate w-full text-left" title={secondaryValue}>{secondaryValue}</p>
                            ) : (
                                <p className="text-[10px] text-transparent select-none">-</p>
                            )
                        )}
                    </div>
                </>
            }
        />
    );
}
