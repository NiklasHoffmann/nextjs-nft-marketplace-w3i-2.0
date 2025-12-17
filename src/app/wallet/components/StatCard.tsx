"use client";

import React from 'react';

type StatVariant = 'green' | 'gray' | 'purple' | 'blue';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    secondaryValue?: string;
    variant: StatVariant;
}

const variantStyles: Record<StatVariant, { bg: string; iconBg: string; text: string }> = {
    green: {
        bg: 'bg-white',
        iconBg: 'bg-green-100',
        text: 'text-green-600'
    },
    gray: {
        bg: 'bg-white',
        iconBg: 'bg-gray-100',
        text: 'text-gray-600'
    },
    purple: {
        bg: 'bg-white',
        iconBg: 'bg-purple-100',
        text: 'text-purple-600'
    },
    blue: {
        bg: 'bg-white',
        iconBg: 'bg-blue-100',
        text: 'text-blue-600'
    }
};

export function StatCard({ icon, label, value, secondaryValue, variant }: StatCardProps) {
    const styles = variantStyles[variant];
    const isNumeric = typeof value === 'number';

    return (
        <div className={`${styles.bg} rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={`${styles.iconBg} rounded-lg p-1.5`}>
                    {icon}
                </div>
                <span className="text-xs font-medium text-gray-600">{label}</span>
            </div>
            <div>
                <p className={`${isNumeric ? 'text-xl' : 'text-base'} font-bold ${styles.text}`}>
                    {value}
                </p>
                {secondaryValue && (
                    <p className="text-xs text-gray-500 mt-0.5">{secondaryValue}</p>
                )}
            </div>
        </div>
    );
}
