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

type StatVariant = 'green' | 'gray' | 'purple' | 'blue';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    secondaryValue?: string;
    variant: StatVariant;
}

const variantStyles: Record<StatVariant, { iconBg: string; textColor: string }> = {
    green: { iconBg: 'bg-green-100', textColor: 'text-green-600' },
    gray: { iconBg: 'bg-gray-100', textColor: 'text-gray-600' },
    purple: { iconBg: 'bg-purple-100', textColor: 'text-purple-600' },
    blue: { iconBg: 'bg-blue-100', textColor: 'text-blue-600' }
};

export function StatCard({ icon, label, value, secondaryValue, variant }: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <BaseCard
            size="sm"
            hoverable
            border="default"
            shadow="sm"
            rounded="xl"
            className="w-full"
            padding="p-3"
            content={
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`${styles.iconBg} rounded-lg p-1.5`}>
                            {icon}
                        </div>
                        <span className="text-xs font-medium text-gray-600">{label}</span>
                    </div>
                    <div>
                        <p className={`text-xl font-bold ${styles.textColor}`}>
                            {value}
                        </p>
                        {secondaryValue && (
                            <p className="text-xs text-gray-500">{secondaryValue}</p>
                        )}
                    </div>
                </>
            }
        />
    );
}
