/**
 * Extended Currency Selector Component
 * 
 * Dropdown selector with category grouping for 76+ tokens
 */

'use client';

import { useState, useMemo } from 'react';
import { useChainId, useReadContract } from 'wagmi';
import {
    ZERO_ADDRESS,
    getAvailableTokens,
    getAllExtendedTokens,
    CATEGORY_NAMES,
    type TokenCategory,
    type ExtendedTokenConfig
} from '@/config/tokens';
import { getMarketplaceAddress } from '@/config';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';

interface ExtendedCurrencySelectorProps {
    value: string; // currency address
    onChange: (currency: string) => void;
    disabled?: boolean;
    className?: string;
    showCategories?: boolean; // Show tokens grouped by category
    allowedCategories?: TokenCategory[]; // Limit to specific categories
}

export function ExtendedCurrencySelector({
    value,
    onChange,
    disabled = false,
    className = '',
    showCategories = true,
    allowedCategories
}: ExtendedCurrencySelectorProps) {
    const chainId = useChainId();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const marketplaceAddress = useMemo(() => {
        if (chainId) {
            const fromConfig = getMarketplaceAddress(chainId);
            if (fromConfig) return fromConfig;
        }
        return process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';
    }, [chainId]);

    const hasMarketplaceAddress = Boolean(marketplaceAddress);

    const { data: allowedCurrencies } = useReadContract({
        address: marketplaceAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getAllowedCurrencies',
        query: { enabled: hasMarketplaceAddress },
    });

    const hasAllowedCurrencyData = Array.isArray(allowedCurrencies);

    const allowedCurrencySet = useMemo(() => {
        if (!Array.isArray(allowedCurrencies)) return new Set<string>();
        return new Set(allowedCurrencies.map((currency) => String(currency).toLowerCase()));
    }, [allowedCurrencies]);

    // Get tokens - show ALL extended tokens on all networks for preview
    const isMainnet = chainId === 1;
    const extendedTokens = getAllExtendedTokens(); // Always show all 76 tokens
    const basicTokens = getAvailableTokens(chainId); // Includes mock tokens on Sepolia/Hardhat

    // Combine tokens: Extended + Mock tokens (mark mainnet tokens as preview on testnets)
    const allTokens = useMemo(() => {
        if (isMainnet) {
            // Mainnet: only extended tokens
            return extendedTokens;
        }

        // Testnets: Extended tokens (marked as preview) + native testnet tokens
        // basicTokens with isMock get "MOCK_TOKENS" category, others get "TESTNET_TOKENS"
        const testnetTokens = basicTokens.map(t => ({
            ...t,
            category: t.isMock ? 'MOCK_TOKENS' : 'TESTNET_TOKENS'
        }));

        const tokens = [
            ...extendedTokens.map(t => ({ ...t, isMock: true })), // Mainnet preview tokens (keep original categories)
            ...testnetTokens // Native testnet tokens (TESTNET_TOKENS or MOCK_TOKENS)
        ];

        // Filter by allowed categories if specified
        let filteredTokens = tokens;
        if (allowedCategories && allowedCategories.length > 0) {
            filteredTokens = tokens.filter(token =>
                token.category && allowedCategories.includes(token.category as TokenCategory)
            );
        }

        // Sort: Mock tokens first, then mainnet preview (isMock=true), then testnet tokens
        return filteredTokens.sort((a, b) => {
            const aIsMockToken = a.category === 'MOCK_TOKENS';
            const bIsMockToken = b.category === 'MOCK_TOKENS';
            const aIsTestnet = a.category === 'TESTNET_TOKENS';
            const bIsTestnet = b.category === 'TESTNET_TOKENS';

            // 1. MOCK_TOKENS first
            if (aIsMockToken && !bIsMockToken) return -1;
            if (!aIsMockToken && bIsMockToken) return 1;

            // 2. TESTNET_TOKENS second
            if (aIsTestnet && !bIsTestnet) return -1;
            if (!aIsTestnet && bIsTestnet) return 1;

            // 3. Rest (mainnet preview tokens) last
            return 0;
        });
    }, [isMainnet, extendedTokens, basicTokens, allowedCategories]);

    // Group tokens by category (works on all networks if tokens have category field)
    const tokensByCategory = useMemo(() => {
        if (!showCategories) return null;

        const grouped: Record<string, ExtendedTokenConfig[]> = {};

        allTokens.forEach(token => {
            const category = token.category || 'MOCK_TOKENS';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category]!.push(token as ExtendedTokenConfig);
        });

        return grouped;
    }, [showCategories, allTokens]);

    // Filter tokens by search
    const filteredTokens = useMemo(() => {
        if (!searchTerm) return allTokens;

        const term = searchTerm.toLowerCase();
        return allTokens.filter(token =>
            token.symbol.toLowerCase().includes(term) ||
            token.name.toLowerCase().includes(term) ||
            token.address.toLowerCase().includes(term)
        );
    }, [allTokens, searchTerm]);

    // Build options
    const options = useMemo(() => {
        const opts: Array<{
            address: string;
            symbol: string;
            name: string;
            icon: string;
            category: string;
            isAllowed: boolean;
                isDisallowed: boolean;
        }> = [
                {
                    address: ZERO_ADDRESS,
                    symbol: 'ETH',
                    name: 'Ether',
                    icon: 'Ξ',
                    category: 'ETH_WRAPPERS',
                    isAllowed: hasAllowedCurrencyData && allowedCurrencySet.has(ZERO_ADDRESS.toLowerCase()),
                    isDisallowed: hasAllowedCurrencyData && !allowedCurrencySet.has(ZERO_ADDRESS.toLowerCase())
                }
            ];

        filteredTokens.forEach(token => {
            let icon = token.icon || 'T';

            opts.push({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                icon: icon,
                category: token.category || 'OTHER',
                isAllowed: hasAllowedCurrencyData && allowedCurrencySet.has(token.address.toLowerCase()),
                isDisallowed: hasAllowedCurrencyData && !allowedCurrencySet.has(token.address.toLowerCase())
            });
        });

        return opts;
    }, [filteredTokens, allowedCurrencySet, hasAllowedCurrencyData]);

    const selectedOption = options.find(opt =>
        opt.address.toLowerCase() === (value || ZERO_ADDRESS).toLowerCase()
    ) ?? options[0]!;

    return (
        <div className={`relative ${className}`}>
            {/* Dropdown Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg font-medium hover:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{selectedOption.icon}</span>
                        <span className="font-medium">{selectedOption.symbol}</span>
                        <span className="text-sm text-gray-500">({selectedOption.name})</span>
                        {selectedOption.isAllowed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                ✓ Allowed
                            </span>
                        )}
                        {selectedOption.isDisallowed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                ⚠ Nicht erlaubt
                            </span>
                        )}
                    </div>
                    <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Options Panel */}
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-[500px] flex flex-col">
                        {/* Search Bar */}
                        {allTokens.length > 10 && (
                            <div className="p-3 border-b border-gray-200">
                                <input
                                    type="text"
                                    placeholder="Search tokens..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

                        {/* Token List */}
                        <div className="overflow-y-auto flex-1">
                            {showCategories && tokensByCategory ? (
                                // Grouped by category with grid layout
                                Object.entries(tokensByCategory)
                                    .sort(([catA], [catB]) => {
                                        // 1. MOCK_TOKENS first
                                        if (catA === 'MOCK_TOKENS') return -1;
                                        if (catB === 'MOCK_TOKENS') return 1;
                                        // 2. TESTNET_TOKENS second
                                        if (catA === 'TESTNET_TOKENS') return -1;
                                        if (catB === 'TESTNET_TOKENS') return 1;
                                        // 3. Rest (mainnet preview) after
                                        return 0;
                                    })
                                    .map(([category, tokens]) => {
                                        const filteredCategoryTokens = tokens.filter(token =>
                                            !searchTerm ||
                                            token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            token.name.toLowerCase().includes(searchTerm.toLowerCase())
                                        );

                                        if (filteredCategoryTokens.length === 0) return null;

                                        return (
                                            <div key={category}>
                                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                                    <span className="text-xs font-semibold text-gray-600 uppercase">
                                                        {CATEGORY_NAMES[category as TokenCategory] || category}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 p-3">
                                                    {filteredCategoryTokens.map((token) => {
                                                        const isSelected = token.address.toLowerCase() === (value || ZERO_ADDRESS).toLowerCase();
                                                        return (
                                                            <TokenGridOption
                                                                key={token.address}
                                                                token={token}
                                                                isSelected={isSelected}
                                                                isAllowed={hasAllowedCurrencyData && allowedCurrencySet.has(token.address.toLowerCase())}
                                                                isDisallowed={hasAllowedCurrencyData && !allowedCurrencySet.has(token.address.toLowerCase())}
                                                                onClick={() => {
                                                                    onChange(token.address);
                                                                    setIsOpen(false);
                                                                    setSearchTerm('');
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                // Flat grid
                                <div className="grid grid-cols-3 gap-2 p-3">
                                    {options.map((option) => {
                                        const isSelected = option.address.toLowerCase() === (value || ZERO_ADDRESS).toLowerCase();
                                        return (
                                            <button
                                                key={option.address}
                                                type="button"
                                                onClick={() => {
                                                    onChange(option.address);
                                                    setIsOpen(false);
                                                    setSearchTerm('');
                                                }}
                                                className={`px-3 py-3 flex flex-col items-center gap-1 rounded-lg border-2 transition-all ${isSelected
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                                                    }`}
                                            >
                                                <span className="text-2xl font-semibold">{option.icon}</span>
                                                <div className="text-center">
                                                    <div className="font-bold text-sm">{option.symbol}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-full">{option.name}</div>
                                                </div>
                                                {option.isAllowed && (
                                                    <span className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">✓</span>
                                                )}
                                                {option.isDisallowed && (
                                                    <span className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px]">!</span>
                                                )}
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-blue-600 absolute top-1 right-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {options.length === 0 && (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    <p className="text-sm">No tokens found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface TokenOptionProps {
    token: ExtendedTokenConfig;
    isSelected: boolean;
    isAllowed: boolean;
    isDisallowed: boolean;
    onClick: () => void;
}

function TokenGridOption({ token, isSelected, isAllowed, isDisallowed, onClick }: TokenOptionProps) {
    const icon = token.icon || 'T';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative px-3 py-3 flex flex-col items-center gap-1 rounded-lg border-2 transition-all ${isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                }`}
        >
            <span className="text-2xl font-semibold">{icon}</span>
            <div className="text-center w-full">
                <div className="font-bold text-sm">{token.symbol}</div>
                <div className="text-xs text-gray-500 truncate max-w-full">{token.name}</div>
            </div>
            {isAllowed && (
                <span className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">✓</span>
            )}
            {isDisallowed && (
                <span className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px]">!</span>
            )}
            {isSelected && (
                <svg className="w-4 h-4 text-blue-600 absolute top-1 right-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            )}
        </button>
    );
}
