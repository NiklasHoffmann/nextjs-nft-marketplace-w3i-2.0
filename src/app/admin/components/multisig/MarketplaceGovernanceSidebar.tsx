'use client';

import { useMemo, useState } from 'react';
import { useChainId, useReadContract } from 'wagmi';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';
import { getMarketplaceAddress } from '@/config';
import { getAvailableTokens, getCurrencySymbolByAddress } from '@/config/tokens';
import { devLog } from '@/utils';

function getNetworkLabel(id?: number): string {
    if (!id) return 'Unknown';
    if (id === 1) return 'Ethereum Mainnet';
    if (id === 11155111) return 'Sepolia Testnet';
    if (id === 31337) return 'Hardhat Local';
    return `Chain ${id}`;
}

function formatFeePercent(value?: bigint): string | null {
    if (value === undefined || value === null) return null;
    const feeValue = Number(value);
    if (Number.isNaN(feeValue)) return null;
    return (feeValue / 1000).toFixed(2);
}

interface MarketplaceGovernanceSidebarProps {
    diamondAddress?: string;
}

export function MarketplaceGovernanceSidebar({ diamondAddress }: MarketplaceGovernanceSidebarProps) {
    const chainId = useChainId();
    const [copied, setCopied] = useState(false);
    const resolvedAddress = useMemo(() => {
        if (diamondAddress) return diamondAddress;
        if (chainId) {
            const fromConfig = getMarketplaceAddress(chainId);
            if (fromConfig) return fromConfig;
        }
        return process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';
    }, [chainId, diamondAddress]);
    const hasAddress = Boolean(resolvedAddress);

    const {
        data: currentFee,
        isLoading: isFeeLoading,
        isError: isFeeError,
    } = useReadContract({
        address: resolvedAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getInnovationFee',
        query: { enabled: hasAddress },
    });

    const {
        data: whitelistedCollections,
        isLoading: isCollectionsLoading,
        isError: isCollectionsError,
    } = useReadContract({
        address: resolvedAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getWhitelistedCollections',
        query: { enabled: hasAddress },
    });

    const {
        data: allowedCurrencies,
        isLoading: isCurrenciesLoading,
        isError: isCurrenciesError,
    } = useReadContract({
        address: resolvedAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getAllowedCurrencies',
        query: { enabled: hasAddress },
    });

    const currentFeePercent = useMemo(() => formatFeePercent(currentFee as bigint | undefined), [currentFee]);

    const whitelistedList = Array.isArray(whitelistedCollections) ? whitelistedCollections : [];
    const currencyList = Array.isArray(allowedCurrencies) ? allowedCurrencies : [];

    const availableTokens = useMemo(() => {
        if (!chainId) return [];
        return getAvailableTokens(chainId);
    }, [chainId]);

    const currencyDisplay = useMemo(() => {
        return currencyList.map((currency) => {
            const address = String(currency);
            const token = availableTokens.find((item) => item.address.toLowerCase() === address.toLowerCase());
            const symbol = token?.symbol || getCurrencySymbolByAddress(chainId || 1, address);
            const name = token?.name || (symbol === 'ETH' ? 'Ether' : 'Unknown Token');
            return {
                address,
                symbol,
                name,
            };
        });
    }, [availableTokens, chainId, currencyList]);

    const visibleCollections = whitelistedList.slice(0, 6);
    const visibleCurrencies = currencyDisplay.slice(0, 6);

    const handleCopyAddress = async () => {
        if (!resolvedAddress) return;
        try {
            await navigator.clipboard.writeText(resolvedAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            devLog.warn('[Multisig] Failed to copy diamond address', err);
        }
    };

    return (
        <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">Marketplace Governance</div>
                <div className="mt-2 text-xs text-gray-500">Network</div>
                <div className="text-sm font-semibold text-gray-900">{getNetworkLabel(chainId)}</div>
                <div className="mt-3 text-xs text-gray-500">Marketplace Address</div>
                <div className="break-all text-xs font-mono text-gray-900">
                    {hasAddress ? resolvedAddress : 'Missing marketplace address'}
                </div>
                <button
                    type="button"
                    onClick={handleCopyAddress}
                    disabled={!hasAddress}
                    className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    {copied ? 'Copied' : 'Copy Address'}
                </button>
                {!hasAddress && (
                    <div className="mt-2 text-xs text-amber-600">
                        Add the chain address in src/config/networks.ts or set NEXT_PUBLIC_MARKETPLACE_ADDRESS.
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">Current Values</div>
                <div className="mt-3 space-y-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                        <span>Innovation Fee</span>
                        <span className="font-semibold text-gray-900">
                            {isFeeError
                                ? 'Unavailable'
                                : currentFeePercent !== null
                                    ? `${currentFeePercent}%`
                                    : isFeeLoading
                                        ? 'Loading...'
                                        : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Whitelisted Collections</span>
                        <span className="font-semibold text-gray-900">
                            {isCollectionsError
                                ? 'Unavailable'
                                : isCollectionsLoading
                                    ? 'Loading...'
                                    : whitelistedList.length}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Allowed Currencies</span>
                        <span className="font-semibold text-gray-900">
                            {isCurrenciesError
                                ? 'Unavailable'
                                : isCurrenciesLoading
                                    ? 'Loading...'
                                    : currencyList.length}
                        </span>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">Whitelisted Collections</div>
                {isCollectionsLoading ? (
                    <div className="mt-2 text-sm text-gray-500">Loading collections...</div>
                ) : whitelistedList.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {visibleCollections.map((collection) => (
                            <span
                                key={collection as string}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-mono text-gray-700"
                            >
                                {(collection as string).slice(0, 6)}...{(collection as string).slice(-4)}
                            </span>
                        ))}
                        {whitelistedList.length > visibleCollections.length && (
                            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500">
                                +{whitelistedList.length - visibleCollections.length} more
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-gray-500">
                        {isCollectionsError ? 'Unable to load collections.' : 'No whitelisted collections found.'}
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">Allowed Currencies</div>
                {isCurrenciesLoading ? (
                    <div className="mt-2 text-sm text-gray-500">Loading currencies...</div>
                ) : currencyList.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {visibleCurrencies.map((currency) => (
                            <span
                                key={currency.address}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                            >
                                <span className="font-semibold">{currency.symbol}</span> <span className="text-gray-500">·</span> {currency.name}
                            </span>
                        ))}
                        {currencyList.length > visibleCurrencies.length && (
                            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500">
                                +{currencyList.length - visibleCurrencies.length} more
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-gray-500">
                        {isCurrenciesError ? 'Unable to load currencies.' : 'No allowed currencies found.'}
                    </div>
                )}
            </div>
        </aside>
    );
}
