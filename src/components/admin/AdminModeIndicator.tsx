/**
 * AdminModeIndicator Component
 * 
 * Shows current admin mode (Single-Owner vs MultiSig) with visual indicator.
 */

'use client';

import { useAdminMode } from '@/hooks';
import { AdminMode } from '@/types/multisig-wallet';

interface AdminModeIndicatorProps {
    diamondAddress: string;
    className?: string;
}

export function AdminModeIndicator({ diamondAddress, className = '' }: AdminModeIndicatorProps) {
    const modeInfo = useAdminMode(diamondAddress);

    const getModeConfig = () => {
        switch (modeInfo.mode) {
            case AdminMode.MULTISIG:
                return {
                    icon: (
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    ),
                    title: 'MultiSig Mode Active',
                    description: 'All operations require 2/3 owner confirmations',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    titleColor: 'text-green-900',
                    textColor: 'text-green-700',
                };
            case AdminMode.TRANSITIONING:
                return {
                    icon: (
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    ),
                    title: 'Ownership Transfer Pending',
                    description: `Pending owner: ${modeInfo.pendingOwner?.slice(0, 10)}...`,
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    titleColor: 'text-yellow-900',
                    textColor: 'text-yellow-700',
                };
            default:
                return {
                    icon: (
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    ),
                    title: 'Single-Owner Mode',
                    description: modeInfo.canUseDirect
                        ? 'Direct execution available'
                        : 'MultiSig migration pending',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    titleColor: 'text-blue-900',
                    textColor: 'text-blue-700',
                };
        }
    };

    const config = getModeConfig();

    return (
        <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor} ${className}`}>
            <div className="flex items-center gap-3">
                {config.icon}
                <div className="flex-1">
                    <h3 className={`font-semibold ${config.titleColor}`}>{config.title}</h3>
                    <p className={`text-sm ${config.textColor}`}>{config.description}</p>
                </div>
                {modeInfo.mode === AdminMode.SINGLE_OWNER && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        Active
                    </span>
                )}
                {modeInfo.mode === AdminMode.MULTISIG && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Secured
                    </span>
                )}
            </div>
        </div>
    );
}
