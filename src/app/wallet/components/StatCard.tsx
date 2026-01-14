/**
 * StatCard Component (USING BaseCard)
 * 
 * Matches design from /nft/[contractAddress] collection header.
 * Clean card design with icon badge, label, and bold value.
 * Now using BaseCard infrastructure with custom styling.
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
}

const variantStyles: Record<StatVariant, { iconBg: string; textColor: string; cardBg?: string; cardBorder?: string }> = {
    green: { iconBg: 'bg-green-100', textColor: 'text-green-600' },
    gray: { iconBg: 'bg-gray-100', textColor: 'text-gray-600' },
    purple: { iconBg: 'bg-purple-100', textColor: 'text-purple-600' },
    blue: { iconBg: 'bg-blue-100', textColor: 'text-blue-600', cardBg: 'bg-blue-50', cardBorder: 'border-blue-200' },
    red: { iconBg: 'bg-red-100', textColor: 'text-red-600', cardBg: 'bg-red-50', cardBorder: 'border-red-200' },
    yellow: { iconBg: 'bg-yellow-100', textColor: 'text-yellow-600', cardBg: 'bg-yellow-50', cardBorder: 'border-yellow-200' }
};

export function StatCard({ icon, label, value, secondaryValue, variant, hideSecondaryPlaceholder = false }: StatCardProps) {
    const styles = variantStyles[variant];
    const isReactNode = typeof value !== 'string' && typeof value !== 'number';

    return (
        <BaseCard
            size="sm"
            hoverable
            border="default"
            shadow="sm"
            rounded="xl"
            className={`w-full h-full flex flex-col ${styles.cardBg || ''} ${styles.cardBorder ? `border ${styles.cardBorder}` : ''}`}
            padding="p-3"
            content={
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`${styles.iconBg} rounded-lg p-1.5`}>
                            {icon}
                        </div>
                        <span className="text-xs font-medium text-gray-600">{label}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-start">
                        {isReactNode ? (
                            <div className={`${styles.textColor}`}>
                                {value}
                            </div>
                        ) : (
                            <div className={`text-xl font-bold ${styles.textColor} truncate w-full text-left`} title={String(value)}>
                                {value}
                            </div>
                        )}
                        {!hideSecondaryPlaceholder && (
                            secondaryValue ? (
                                <p className="text-xs text-gray-500 truncate w-full text-left" title={secondaryValue}>{secondaryValue}</p>
                            ) : (
                                <p className="text-xs text-transparent select-none">-</p>
                            )
                        )}
                    </div>
                </>
            }
        />
    );
}
