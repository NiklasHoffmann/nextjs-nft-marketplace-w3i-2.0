"use client";

import { useEnsName } from 'wagmi';
import { getAddress, isAddress } from 'viem';

interface AddressWithEnsProps {
    address?: string | null;
    className?: string;
    fallback?: string;
    showAddress?: boolean;
    debug?: boolean;
}

const formatShortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export function AddressWithEns({
    address,
    className,
    fallback = '—',
    showAddress = false,
    debug = false,
}: AddressWithEnsProps) {
    const normalized = address?.trim();
    const isValid = Boolean(normalized && isAddress(normalized));
    const checksummed = isValid ? getAddress(normalized!) : undefined;

    const { data: ensName, isLoading, isError, error } = useEnsName({
        address: checksummed,
        chainId: 1,
        query: { enabled: Boolean(checksummed) },
    });

    const display = ensName || (isValid ? formatShortAddress(checksummed!) : fallback);

    const debugEnabled = debug && process.env.NODE_ENV !== 'production';
    const debugTitle = debugEnabled
        ? `addr=${checksummed || 'n/a'}; enabled=${Boolean(checksummed)}; loading=${isLoading}; error=${isError ? (error?.message || 'true') : 'none'}; ens=${ensName || 'none'}`
        : undefined;

    return (
        <span className={className} title={debugTitle || (isValid ? checksummed : undefined)}>
            {display}
            {showAddress && ensName && isValid && (
                <span className="ml-1 font-mono text-xs text-gray-500">
                    {formatShortAddress(checksummed!)}
                </span>
            )}
        </span>
    );
}
