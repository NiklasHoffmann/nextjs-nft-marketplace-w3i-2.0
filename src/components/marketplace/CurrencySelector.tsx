/**
 * Currency Selector Component
 * 
 * Dropdown selector for ETH, WETH, USDC, DAI and other supported tokens
 */

'use client';

import { useState, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { ZERO_ADDRESS, getAvailableTokens, getCurrencySymbolByAddress } from '@/config/tokens';

interface CurrencySelectorProps {
    value: string; // currency address
    onChange: (currency: string) => void;
    disabled?: boolean;
    className?: string;
}

export function CurrencySelector({ value, onChange, disabled = false, className = '' }: CurrencySelectorProps) {
    const chainId = useChainId();
    const [isOpen, setIsOpen] = useState(false);

    // Get all available tokens for current chain
    const availableTokens = getAvailableTokens(chainId);
    
    // Build all options including ETH
    const allOptions = useMemo(() => {
        const opts: Array<{
            address: string;
            symbol: string;
            name: string;
            icon: string;
            category: string;
            isMock: boolean;
        }> = [
            { address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ether', icon: 'Ξ', category: 'NATIVE', isMock: false }
        ];
        
        availableTokens.forEach(token => {
            // Icon mapping for all tokens (including mocks)
            let icon = 'T'; // default
            switch(token.symbol) {
                case 'WETH': icon = 'W'; break;
                case 'USDC': icon = '$'; break;
                case 'DAI': icon = 'D'; break;
                case 'MERC20': icon = 'M'; break;
                case 'MWBTC': icon = '₿'; break;
                case 'MEURS': icon = '€'; break;
                case 'MUSDT': icon = '₮'; break;
            }
            
            opts.push({
                address: token.address as string,
                symbol: token.symbol,
                name: token.name,
                icon: icon,
                category: token.isMock ? 'MOCK_TOKENS' : 'PRODUCTION',
                isMock: token.isMock || false
            });
        });
        
        return opts;
    }, [availableTokens]);

    // Group tokens by category
    const tokensByCategory = useMemo(() => {
        const grouped: Record<string, typeof allOptions> = {};
        
        allOptions.forEach(token => {
            const category = token.category;
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(token);
        });
        
        // Sort categories: NATIVE first, then MOCK_TOKENS, then PRODUCTION
        const sortedCategories: Record<string, typeof allOptions> = {};
        if (grouped['NATIVE']) sortedCategories['NATIVE'] = grouped['NATIVE'];
        if (grouped['MOCK_TOKENS']) sortedCategories['MOCK_TOKENS'] = grouped['MOCK_TOKENS'];
        if (grouped['PRODUCTION']) sortedCategories['PRODUCTION'] = grouped['PRODUCTION'];
        
        return sortedCategories;
    }, [allOptions]);

    const categoryNames: Record<string, string> = {
        'NATIVE': 'Native Currency',
        'MOCK_TOKENS': 'Mock Tokens (Testing)',
        'PRODUCTION': 'Production Tokens'
    };

    const selectedOption = allOptions.find(opt => 
        opt.address.toLowerCase() === (value || ZERO_ADDRESS).toLowerCase()
    ) ?? allOptions[0]!;

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
                    
                    {/* Options - Grid Layout with Categories */}
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-[400px] overflow-y-auto">
                        {Object.entries(tokensByCategory).map(([category, tokens]) => (
                            <div key={category}>
                                {/* Category Header */}
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
                                    <span className="text-xs font-semibold text-gray-600 uppercase">
                                        {categoryNames[category] || category}
                                    </span>
                                </div>
                                {/* Token Grid */}
                                <div className="grid grid-cols-3 gap-2 p-3">
                                    {tokens.map((option) => {
                                        const isSelected = option.address.toLowerCase() === (value || ZERO_ADDRESS).toLowerCase();
                                        return (
                                            <button
                                                key={option.address}
                                                type="button"
                                                onClick={() => {
                                                    onChange(option.address);
                                                    setIsOpen(false);
                                                }}
                                                className={`relative px-3 py-3 flex flex-col items-center gap-1 rounded-lg border-2 transition-all ${
                                                    isSelected 
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                                                }`}
                                            >
                                                <span className="text-2xl font-semibold">{option.icon}</span>
                                                <div className="text-center w-full">
                                                    <div className="font-bold text-sm">{option.symbol}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-full">{option.name}</div>
                                                </div>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-blue-600 absolute top-1 right-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Currency Badge - Small badge showing currency type
 */
interface CurrencyBadgeProps {
    currency: string;
    chainId?: number;
    className?: string;
}

export function CurrencyBadge({ currency, chainId, className = '' }: CurrencyBadgeProps) {
    const currentChainId = useChainId();
    const effectiveChainId = chainId || currentChainId;
    
    const isETH = currency === ZERO_ADDRESS || currency === '0x0' || !currency;
    
    if (isETH) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded ${className}`}>
                <span>Ξ</span>
                <span>ETH</span>
            </span>
        );
    }

    const symbol = getCurrencySymbolByAddress(effectiveChainId, currency);
    const colors: Record<string, string> = {
        'WETH': 'bg-purple-100 text-purple-700',
        'USDC': 'bg-green-100 text-green-700',
        'DAI': 'bg-yellow-100 text-yellow-700',
        // ======================================== MOCK TOKENS COLORS (easy to remove)
        'MERC20': 'bg-orange-100 text-orange-700',
        'MWBTC': 'bg-amber-100 text-amber-700',
        'MEURS': 'bg-indigo-100 text-indigo-700',
        'MUSDT': 'bg-teal-100 text-teal-700'
        // ======================================== END MOCK TOKENS
    };
    
    const colorClass = colors[symbol] || 'bg-gray-100 text-gray-700';
    
    // Icon mapping for badges
    let icon = 'T'; // default
    switch(symbol) {
        case 'WETH': icon = 'W'; break;
        case 'USDC': icon = '$'; break;
        case 'DAI': icon = 'D'; break;
        case 'MERC20': icon = 'M'; break;
        case 'MWBTC': icon = '₿'; break;
        case 'MEURS': icon = '€'; break;
        case 'MUSDT': icon = '₮'; break;
    }
    
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${colorClass} rounded ${className}`}>
            <span>{icon}</span>
            <span>{symbol}</span>
        </span>
    );
}
