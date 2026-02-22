'use client';

/**
 * Shopping Cart Page
 * 
 * Allows users to review and purchase multiple NFTs sequentially in one flow.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, usePublicClient, useSendTransaction } from 'wagmi';
import { useCart } from '@/contexts';
import { formatUnits, parseUnits } from 'viem';
import Link from 'next/link';
import { ButtonSpinner } from '@/components/core/Loading';
import { EmptyState } from '@/components/core/Empty';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress, getWETHAddress, isNativeETH, ZERO_ADDRESS } from '@/config/tokens';
import { useTransactionService } from '@/services/blockchain';
import { useMarketplaceContracts, useMarketplaceFees } from '@/hooks/marketplace';
import { devLog, formatTokenDisplay } from '@/utils';

interface EnrichedCartItem {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    price: string;
    currency?: string | null;
    seller: string;
    tokenStandard?: 'ERC721' | 'ERC1155' | null;
    erc1155QuantityListed?: string | null;
    remainingQuantity?: string | null;
    unitPrice?: string | null;
    partialBuyEnabled?: boolean;
    desiredErc1155Quantity?: string | null;
    feeRate?: string | number | null;
    royaltyFeePercentage?: number | null;
    name?: string;
    imageUrl?: string;
}

const ERC2981_ABI = [
    {
        type: 'function',
        name: 'royaltyInfo',
        stateMutability: 'view',
        inputs: [
            { name: '_tokenId', type: 'uint256' },
            { name: '_salePrice', type: 'uint256' }
        ],
        outputs: [
            { name: 'receiver', type: 'address' },
            { name: 'royaltyAmount', type: 'uint256' }
        ]
    }
] as const;

const ERC20_BALANCE_ABI = [
    {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
] as const;

interface CurrencyRequirement {
    symbol: string;
    currencyAddress: string;
    decimals: number;
    totalRequired: number;
}

export function CartPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { items, itemCount, removeFromCart, clearCart, updateCartItem } = useCart();
    const { marketplaceAddress } = useMarketplaceContracts();
    const { innovationFeePercentage } = useMarketplaceFees({ marketplaceAddress });
    const txService = useTransactionService();
    const { sendTransactionAsync, isPending: isSigningSwapTx } = useSendTransaction();
    const [isProcessing, setIsProcessing] = useState(false);
    const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
    const [erc1155PurchaseQuantities, setErc1155PurchaseQuantities] = useState<Record<string, string>>({});
    const [royaltyPercentageByListingId, setRoyaltyPercentageByListingId] = useState<Record<string, number>>({});
    const [tokenBalanceBySymbol, setTokenBalanceBySymbol] = useState<Record<string, number>>({});
    const [oneWethRateBySymbol, setOneWethRateBySymbol] = useState<Record<string, number>>({});
    const [swapSourceAmountBySymbol, setSwapSourceAmountBySymbol] = useState<Record<string, string>>({});
    const [swapSlippageBySymbol, setSwapSlippageBySymbol] = useState<Record<string, string>>({});
    const [swapStatusBySymbol, setSwapStatusBySymbol] = useState<Record<string, { state: 'idle' | 'processing' | 'success' | 'error'; message?: string; txHash?: string }>>({});
    const [activeSwapSymbol, setActiveSwapSymbol] = useState<string | null>(null);

    const wethAddress = getWETHAddress(chainId || 11155111);

    const quantityByListingId = useMemo(() => {
        const map = new Map<string, number>();

        enrichedItems.forEach((item) => {
            const isErc1155 = item.tokenStandard === 'ERC1155';
            if (!isErc1155) {
                map.set(item.listingId, 1);
                return;
            }

            const maxRaw = item.remainingQuantity || item.erc1155QuantityListed || '0';
            const maxQuantity = parseInt(maxRaw, 10);
            const safeMax = Number.isFinite(maxQuantity) && maxQuantity > 0 ? maxQuantity : 0;

            if (!item.partialBuyEnabled) {
                map.set(item.listingId, safeMax);
                return;
            }

            const selected = parseInt(erc1155PurchaseQuantities[item.listingId] || '1', 10);
            const safeSelected = Number.isFinite(selected) ? selected : 1;
            map.set(item.listingId, safeSelected);
        });

        return map;
    }, [enrichedItems, erc1155PurchaseQuantities]);

    const totalPriceByToken = useMemo(() => {
        const totals = new Map<string, number>();

        enrichedItems.forEach((item) => {
            try {
                const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                const decimals = getTokenDecimalsByAddress(chainId || 11155111, item.currency);
                const quantity = quantityByListingId.get(item.listingId) || 0;

                let priceWei = BigInt(item.price);
                if (item.tokenStandard === 'ERC1155' && item.unitPrice) {
                    priceWei = BigInt(item.unitPrice) * BigInt(quantity);
                }

                const amount = parseFloat(formatUnits(priceWei, decimals));
                totals.set(symbol, (totals.get(symbol) || 0) + amount);
            } catch {
                // ignore malformed item
            }
        });

        return Array.from(totals.entries()).map(([symbol, total]) => ({ symbol, total }));
    }, [enrichedItems, chainId, quantityByListingId]);

    useEffect(() => {
        let canceled = false;

        const fetchRoyalties = async () => {
            if (!publicClient || enrichedItems.length === 0) {
                if (!canceled) {
                    setRoyaltyPercentageByListingId({});
                }
                return;
            }

            const entries = await Promise.all(
                enrichedItems.map(async (item) => {
                    try {
                        const royaltyData = await publicClient.readContract({
                            address: item.contractAddress as `0x${string}`,
                            abi: ERC2981_ABI,
                            functionName: 'royaltyInfo',
                            args: [BigInt(item.tokenId), BigInt(10000)]
                        });

                        const royaltyBps = Number(royaltyData?.[1] ?? 0);
                        const royaltyPercentage = Number.isFinite(royaltyBps) ? royaltyBps / 100 : 0;
                        if (item.royaltyFeePercentage !== royaltyPercentage) {
                            updateCartItem(item.listingId, { royaltyFeePercentage: royaltyPercentage });
                        }
                        return [item.listingId, royaltyPercentage] as const;
                    } catch {
                        if ((item.royaltyFeePercentage ?? 0) !== 0) {
                            updateCartItem(item.listingId, { royaltyFeePercentage: 0 });
                        }
                        return [item.listingId, 0] as const;
                    }
                })
            );

            if (canceled) return;
            setRoyaltyPercentageByListingId(Object.fromEntries(entries));
        };

        fetchRoyalties();

        return () => {
            canceled = true;
        };
    }, [publicClient, enrichedItems, updateCartItem]);

    const feeTotalsByToken = useMemo(() => {
        const totals = new Map<string, number>();

        enrichedItems.forEach((item) => {
            try {
                const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                const decimals = getTokenDecimalsByAddress(chainId || 11155111, item.currency);
                const quantity = quantityByListingId.get(item.listingId) || 0;

                let priceWei = BigInt(item.price);
                if (item.tokenStandard === 'ERC1155' && item.unitPrice) {
                    priceWei = BigInt(item.unitPrice) * BigInt(quantity);
                }

                const baseAmount = parseFloat(formatUnits(priceWei, decimals));
                const marketplacePercentage = item.feeRate !== undefined && item.feeRate !== null
                    ? Number(item.feeRate) / 1000
                    : innovationFeePercentage * 100;
                const royaltyPercentage = royaltyPercentageByListingId[item.listingId] || 0;
                const totalFee = baseAmount * ((marketplacePercentage + royaltyPercentage) / 100);

                totals.set(symbol, (totals.get(symbol) || 0) + totalFee);
            } catch {
                // ignore malformed item
            }
        });

        return Array.from(totals.entries()).map(([symbol, total]) => ({ symbol, total }));
    }, [enrichedItems, chainId, quantityByListingId, innovationFeePercentage, royaltyPercentageByListingId]);

    const marketplaceFeeTotalsByToken = useMemo(() => {
        const totals = new Map<string, number>();

        enrichedItems.forEach((item) => {
            try {
                const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                const decimals = getTokenDecimalsByAddress(chainId || 11155111, item.currency);
                const quantity = quantityByListingId.get(item.listingId) || 0;

                let priceWei = BigInt(item.price);
                if (item.tokenStandard === 'ERC1155' && item.unitPrice) {
                    priceWei = BigInt(item.unitPrice) * BigInt(quantity);
                }

                const baseAmount = parseFloat(formatUnits(priceWei, decimals));
                const marketplacePercentage = item.feeRate !== undefined && item.feeRate !== null
                    ? Number(item.feeRate) / 1000
                    : innovationFeePercentage * 100;
                const marketplaceFee = baseAmount * (marketplacePercentage / 100);

                totals.set(symbol, (totals.get(symbol) || 0) + marketplaceFee);
            } catch {
                // ignore malformed item
            }
        });

        return Array.from(totals.entries()).map(([symbol, total]) => ({ symbol, total }));
    }, [enrichedItems, chainId, quantityByListingId, innovationFeePercentage]);

    const creatorRoyaltyTotalsByToken = useMemo(() => {
        const totals = new Map<string, number>();

        enrichedItems.forEach((item) => {
            try {
                const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                const decimals = getTokenDecimalsByAddress(chainId || 11155111, item.currency);
                const quantity = quantityByListingId.get(item.listingId) || 0;

                let priceWei = BigInt(item.price);
                if (item.tokenStandard === 'ERC1155' && item.unitPrice) {
                    priceWei = BigInt(item.unitPrice) * BigInt(quantity);
                }

                const baseAmount = parseFloat(formatUnits(priceWei, decimals));
                const royaltyPercentage = royaltyPercentageByListingId[item.listingId] || 0;
                const creatorRoyalty = baseAmount * (royaltyPercentage / 100);

                totals.set(symbol, (totals.get(symbol) || 0) + creatorRoyalty);
            } catch {
                // ignore malformed item
            }
        });

        return Array.from(totals.entries()).map(([symbol, total]) => ({ symbol, total }));
    }, [enrichedItems, chainId, quantityByListingId, royaltyPercentageByListingId]);

    const totalWithFeesByToken = useMemo(() => {
        const priceMap = new Map(totalPriceByToken.map((entry) => [entry.symbol, entry.total]));
        const feeMap = new Map(feeTotalsByToken.map((entry) => [entry.symbol, entry.total]));
        const symbols = new Set([...priceMap.keys(), ...feeMap.keys()]);

        return Array.from(symbols).map((symbol) => ({
            symbol,
            total: (priceMap.get(symbol) || 0) + (feeMap.get(symbol) || 0)
        }));
    }, [totalPriceByToken, feeTotalsByToken]);

    const cartCurrencyRequirements = useMemo<CurrencyRequirement[]>(() => {
        return totalWithFeesByToken
            .map((entry) => {
                const matchingItem = enrichedItems.find((item) => {
                    const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                    return symbol === entry.symbol;
                });

                if (!matchingItem) return null;

                const currencyAddress = matchingItem.currency || ZERO_ADDRESS;
                const decimals = getTokenDecimalsByAddress(chainId || 11155111, currencyAddress);

                return {
                    symbol: entry.symbol,
                    currencyAddress,
                    decimals,
                    totalRequired: entry.total,
                };
            })
            .filter((entry): entry is CurrencyRequirement => entry !== null);
    }, [totalWithFeesByToken, enrichedItems, chainId]);

    const feeRatesSummary = useMemo(() => {
        const marketplaceRates = new Set<number>();
        const creatorRates = new Set<number>();

        enrichedItems.forEach((item) => {
            const marketplaceRate = item.feeRate !== undefined && item.feeRate !== null
                ? Number(item.feeRate) / 1000
                : innovationFeePercentage * 100;
            const creatorRate = royaltyPercentageByListingId[item.listingId] ?? item.royaltyFeePercentage ?? 0;

            if (Number.isFinite(marketplaceRate)) marketplaceRates.add(Number(marketplaceRate.toFixed(2)));
            if (Number.isFinite(creatorRate)) creatorRates.add(Number(creatorRate.toFixed(2)));
        });

        const marketplaceValues = Array.from(marketplaceRates);
        const creatorValues = Array.from(creatorRates);

        const formatRate = (values: number[]) => {
            if (values.length === 0) return '0.00%';
            if (values.length === 1) {
                const singleValue = values[0];
                return singleValue !== undefined ? `${singleValue.toFixed(2)}%` : '0.00%';
            }
            return `${Math.min(...values).toFixed(2)}% - ${Math.max(...values).toFixed(2)}%`;
        };

        return {
            marketplaceLabel: formatRate(marketplaceValues),
            creatorLabel: formatRate(creatorValues),
            isMixed: marketplaceValues.length > 1 || creatorValues.length > 1
        };
    }, [enrichedItems, innovationFeePercentage, royaltyPercentageByListingId]);

    const hasSingleToken = totalPriceByToken.length === 1;
    const primaryTotal = hasSingleToken ? totalPriceByToken[0] : null;

    const totalSummaryByToken = useMemo(() => {
        if (hasSingleToken && primaryTotal && primaryTotal.symbol === 'ETH') {
            return [{ symbol: 'ETH', total: ((totalWithFeesByToken[0]?.total || 0) + 0.005) }];
        }
        return totalWithFeesByToken;
    }, [hasSingleToken, primaryTotal, totalWithFeesByToken]);

    const renderTokenRows = (entries: Array<{ symbol: string; total: number }>, amountClassName: string = 'font-medium text-gray-900') => {
        if (entries.length === 0) {
            return <span className={amountClassName}>0</span>;
        }

        return (
            <span className="inline-flex flex-col items-end gap-0.5">
                {entries.map((entry) => (
                    <span key={`${entry.symbol}-${entry.total}`} className="inline-grid grid-cols-[1fr_3.5rem] gap-2 items-baseline tabular-nums">
                        <span className={`text-right ${amountClassName}`}>{entry.total.toFixed(4)}</span>
                        <span className="text-left font-semibold text-gray-700">{entry.symbol}</span>
                    </span>
                ))}
            </span>
        );
    };

    // Enrich cart items with metadata from MongoDB
    useEffect(() => {
        const enrichItems = async () => {
            const enriched = await Promise.all(
                items.map(async (item) => {
                    const needsListingData =
                        item.feeRate === undefined ||
                        item.feeRate === null ||
                        item.tokenStandard === undefined ||
                        item.tokenStandard === null ||
                        (item.tokenStandard === 'ERC1155' && (!item.unitPrice || !item.remainingQuantity));

                    if (item.imageUrl && item.name && !needsListingData) {
                        devLog.info('cart', 'Cart item already enriched:', item.name, item.imageUrl);
                        return item;
                    }

                    // Fetch metadata from API
                    try {
                        devLog.info('cart', 'Fetching metadata for:', item.contractAddress, item.tokenId);
                        const response = await fetch(`/api/nft/detail?contractAddress=${item.contractAddress}&tokenId=${item.tokenId}`);
                        const raw = await response.json();
                        const data = raw?.success ? raw.data : raw;
                        devLog.info('cart', 'Metadata response:', data);

                        const name = data.metadata?.name || data.name || item.name;
                        const imageUrl = data.metadata?.image || data.image || item.imageUrl;
                        const feeRate = data.marketplace?.feeRate ?? item.feeRate ?? null;
                        const tokenStandard = data.marketplace?.tokenStandard ?? item.tokenStandard ?? null;
                        const erc1155QuantityListed = data.marketplace?.erc1155QuantityListed ?? item.erc1155QuantityListed ?? null;
                        const remainingQuantity = data.marketplace?.remainingQuantity ?? item.remainingQuantity ?? null;
                        const unitPrice = data.marketplace?.unitPrice ?? item.unitPrice ?? null;
                        const partialBuyEnabled = data.marketplace?.partialBuyEnabled ?? item.partialBuyEnabled ?? false;
                        const desiredErc1155Quantity = data.marketplace?.desiredErc1155Quantity ?? item.desiredErc1155Quantity ?? null;
                        const royaltyFeePercentage = item.royaltyFeePercentage ?? null;

                        // Update cart item with metadata (persists to localStorage)
                        updateCartItem(item.listingId, {
                            name,
                            imageUrl,
                            feeRate,
                            tokenStandard,
                            erc1155QuantityListed,
                            remainingQuantity,
                            unitPrice,
                            partialBuyEnabled,
                            desiredErc1155Quantity,
                            royaltyFeePercentage
                        });

                        const enrichedItem = {
                            ...item,
                            name,
                            imageUrl,
                            feeRate,
                            tokenStandard,
                            erc1155QuantityListed,
                            remainingQuantity,
                            unitPrice,
                            partialBuyEnabled,
                            desiredErc1155Quantity,
                            royaltyFeePercentage
                        };

                        devLog.info('cart', 'Enriched item:', enrichedItem.name, enrichedItem.imageUrl);
                        return enrichedItem;
                    } catch (error) {
                        devLog.error('cart', 'Failed to enrich cart item:', error);
                        return item;
                    }
                })
            );

            devLog.info('cart', 'Final enriched items:', enriched);
            setEnrichedItems(enriched);
        };

        if (items.length > 0) {
            enrichItems();
        } else {
            setEnrichedItems([]);
        }
    }, [items, updateCartItem]);

    useEffect(() => {
        setErc1155PurchaseQuantities((prev) => {
            const next = { ...prev };

            for (const item of enrichedItems) {
                if (item.tokenStandard !== 'ERC1155' || !item.partialBuyEnabled) continue;
                if (!next[item.listingId]) {
                    next[item.listingId] = '1';
                }
            }

            for (const listingId of Object.keys(next)) {
                if (!enrichedItems.some((item) => item.listingId === listingId)) {
                    delete next[listingId];
                }
            }

            return next;
        });
    }, [enrichedItems]);

    const estimatedGasInfo = useMemo(() => {
        if (itemCount <= 1) return '~0.005 ETH';
        return 'Varies by number of individual purchase confirmations';
    }, [itemCount]);

    const swapRelevantCurrencies = useMemo(() => {
        if (!wethAddress) return [] as CurrencyRequirement[];
        return cartCurrencyRequirements.filter((entry) => {
            if (isNativeETH(entry.currencyAddress)) return false;
            return entry.currencyAddress.toLowerCase() !== wethAddress.toLowerCase();
        });
    }, [cartCurrencyRequirements, wethAddress]);

    const currencyDeficitBySymbol = useMemo(() => {
        const map: Record<string, number> = {};
        for (const entry of swapRelevantCurrencies) {
            const balance = tokenBalanceBySymbol[entry.symbol] || 0;
            map[entry.symbol] = Math.max(entry.totalRequired - balance, 0);
        }
        return map;
    }, [swapRelevantCurrencies, tokenBalanceBySymbol]);

    const hasUnpreparedSwapRequirement = useMemo(() => {
        return swapRelevantCurrencies.some((entry) => (currencyDeficitBySymbol[entry.symbol] || 0) > 0.000001);
    }, [swapRelevantCurrencies, currencyDeficitBySymbol]);

    useEffect(() => {
        let cancelled = false;

        const fetchTokenBalances = async () => {
            if (!publicClient || !address || swapRelevantCurrencies.length === 0) {
                if (!cancelled) setTokenBalanceBySymbol({});
                return;
            }

            const entries = await Promise.all(
                swapRelevantCurrencies.map(async (entry) => {
                    try {
                        const balanceRaw = await publicClient.readContract({
                            address: entry.currencyAddress as `0x${string}`,
                            abi: ERC20_BALANCE_ABI,
                            functionName: 'balanceOf',
                            args: [address],
                        });
                        const balance = parseFloat(formatUnits(balanceRaw, entry.decimals));
                        return [entry.symbol, Number.isFinite(balance) ? balance : 0] as const;
                    } catch {
                        return [entry.symbol, 0] as const;
                    }
                })
            );

            if (!cancelled) {
                setTokenBalanceBySymbol(Object.fromEntries(entries));
            }
        };

        void fetchTokenBalances();
        return () => { cancelled = true; };
    }, [publicClient, address, swapRelevantCurrencies]);

    useEffect(() => {
        let cancelled = false;

        const fetchOneWethRates = async () => {
            if (!wethAddress || swapRelevantCurrencies.length === 0) {
                if (!cancelled) setOneWethRateBySymbol({});
                return;
            }

            const entries = await Promise.all(
                swapRelevantCurrencies.map(async (entry) => {
                    try {
                        const amount = parseUnits('1', 18).toString();
                        const params = new URLSearchParams({
                            chainId: String(chainId || 11155111),
                            src: wethAddress,
                            dst: entry.currencyAddress,
                            amount,
                            includeTokensInfo: 'true',
                        });

                        const response = await fetch(`/api/integrations/1inch/quote?${params.toString()}`, {
                            method: 'GET',
                            cache: 'no-store',
                        });

                        const json = await response.json();
                        if (!response.ok || !json?.success) {
                            return [entry.symbol, 0] as const;
                        }

                        const dstAmountRaw = String(json.data?.quote?.dstAmount || '0');
                        const decimals = Number(json.data?.quote?.dstToken?.decimals ?? entry.decimals);
                        const output = parseFloat(formatUnits(BigInt(dstAmountRaw), decimals));
                        return [entry.symbol, Number.isFinite(output) ? output : 0] as const;
                    } catch {
                        return [entry.symbol, 0] as const;
                    }
                })
            );

            if (!cancelled) {
                setOneWethRateBySymbol(Object.fromEntries(entries));
            }
        };

        void fetchOneWethRates();
        return () => { cancelled = true; };
    }, [swapRelevantCurrencies, wethAddress, chainId]);

    useEffect(() => {
        setSwapSlippageBySymbol((prev) => {
            const next = { ...prev };
            for (const entry of swapRelevantCurrencies) {
                if (!next[entry.symbol]) next[entry.symbol] = '1';
            }
            return next;
        });
    }, [swapRelevantCurrencies]);

    useEffect(() => {
        setSwapSourceAmountBySymbol((prev) => {
            const next = { ...prev };
            for (const entry of swapRelevantCurrencies) {
                const deficit = currencyDeficitBySymbol[entry.symbol] || 0;
                const oneWethOutput = oneWethRateBySymbol[entry.symbol] || 0;
                if (oneWethOutput <= 0) continue;
                const currentAmount = next[entry.symbol];
                if (currentAmount && parseFloat(currentAmount) > 0) continue;

                const requiredWeth = deficit > 0 ? (deficit / oneWethOutput) * 1.02 : 0.01;
                next[entry.symbol] = Math.max(requiredWeth, 0.01).toFixed(4);
            }
            return next;
        });
    }, [swapRelevantCurrencies, currencyDeficitBySymbol, oneWethRateBySymbol]);

    const handlePrepareAndExecuteCurrencySwap = async (entry: CurrencyRequirement) => {
        if (!address || !wethAddress) return;

        const sourceAmount = swapSourceAmountBySymbol[entry.symbol] || '0';
        const slippage = swapSlippageBySymbol[entry.symbol] || '1';

        try {
            setActiveSwapSymbol(entry.symbol);
            const sourceAmountNum = parseFloat(sourceAmount);
            const slippageNum = parseFloat(slippage);

            if (!Number.isFinite(sourceAmountNum) || sourceAmountNum <= 0) {
                throw new Error('Enter a valid WETH amount');
            }
            if (!Number.isFinite(slippageNum) || slippageNum <= 0 || slippageNum > 50) {
                throw new Error('Slippage must be between 0 and 50');
            }

            setSwapStatusBySymbol((prev) => ({
                ...prev,
                [entry.symbol]: { state: 'processing', message: 'Preparing 1inch route...' },
            }));

            const response = await fetch('/api/integrations/1inch/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chainId,
                    src: wethAddress,
                    dst: entry.currencyAddress,
                    amount: parseUnits(sourceAmount, 18).toString(),
                    from: address,
                    slippage: slippageNum,
                    includeTokensInfo: true,
                    includeProtocols: false,
                    disableEstimate: false,
                    allowPartialFill: false,
                }),
            });

            const json = await response.json();
            if (!response.ok || !json?.success || !json?.data?.swap?.tx) {
                throw new Error(json?.error || 'Failed to prepare swap');
            }

            const tx = json.data.swap.tx as { to: string; data: string; value: string };

            setSwapStatusBySymbol((prev) => ({
                ...prev,
                [entry.symbol]: { state: 'processing', message: 'Sign transaction in wallet...' },
            }));

            const hash = await sendTransactionAsync({
                to: tx.to as `0x${string}`,
                data: tx.data as `0x${string}`,
                value: BigInt(tx.value || '0'),
            });

            setSwapStatusBySymbol((prev) => ({
                ...prev,
                [entry.symbol]: { state: 'processing', message: 'Waiting for confirmation...', txHash: hash },
            }));

            const receipt = await publicClient?.waitForTransactionReceipt({ hash });
            if (!receipt || receipt.status !== 'success') {
                throw new Error('Swap transaction failed');
            }

            setSwapStatusBySymbol((prev) => ({
                ...prev,
                [entry.symbol]: { state: 'success', message: 'Swap confirmed', txHash: hash },
            }));

            const updatedBalanceRaw = await publicClient?.readContract({
                address: entry.currencyAddress as `0x${string}`,
                abi: ERC20_BALANCE_ABI,
                functionName: 'balanceOf',
                args: [address],
            });

            if (updatedBalanceRaw !== undefined) {
                const updatedBalance = parseFloat(formatUnits(updatedBalanceRaw, entry.decimals));
                setTokenBalanceBySymbol((prev) => ({ ...prev, [entry.symbol]: updatedBalance }));
            }
        } catch (error) {
            setSwapStatusBySymbol((prev) => ({
                ...prev,
                [entry.symbol]: {
                    state: 'error',
                    message: error instanceof Error ? error.message : 'Swap failed',
                },
            }));
        } finally {
            setActiveSwapSymbol(null);
        }
    };

    const handleBatchPurchase = async () => {
        if (!isConnected || itemCount === 0) return;

        setIsProcessing(true);
        try {
            for (const item of enrichedItems) {
                if (!item.listingId || !item.contractAddress || !item.tokenId || !item.price || !item.seller) {
                    devLog.warn('cart', 'Skipping item with missing listing data:', item);
                    continue;
                }

                const tokenDecimals = getTokenDecimalsByAddress(chainId, item.currency || ZERO_ADDRESS);
                const isErc1155 = item.tokenStandard === 'ERC1155';
                const maxRaw = item.remainingQuantity || item.erc1155QuantityListed || '0';
                const maxQuantity = parseInt(maxRaw, 10);
                const safeMaxQuantity = Number.isFinite(maxQuantity) && maxQuantity > 0 ? maxQuantity : 0;

                let expectedPriceWei = BigInt(item.price);
                let expectedErc1155Quantity: string | undefined;
                let erc1155PurchaseQuantity: string | undefined;

                if (isErc1155) {
                    if (safeMaxQuantity <= 0) {
                        throw new Error(`No remaining ERC1155 quantity available for listing ${item.listingId}`);
                    }

                    const selectedRaw = item.partialBuyEnabled
                        ? (erc1155PurchaseQuantities[item.listingId] || '1')
                        : String(safeMaxQuantity);
                    const selectedQty = parseInt(selectedRaw, 10);

                    if (!Number.isFinite(selectedQty) || selectedQty <= 0 || selectedQty > safeMaxQuantity) {
                        throw new Error(`Invalid ERC1155 quantity for listing ${item.listingId}. Choose 1-${safeMaxQuantity}.`);
                    }

                    expectedErc1155Quantity = String(safeMaxQuantity);
                    erc1155PurchaseQuantity = String(selectedQty);

                    if (item.unitPrice) {
                        expectedPriceWei = BigInt(item.unitPrice) * BigInt(selectedQty);
                    }
                }

                const expectedPrice = formatUnits(expectedPriceWei, tokenDecimals);

                const result = await txService.purchaseNFT({
                    listingId: item.listingId,
                    price: expectedPrice,
                    currency: item.currency || ZERO_ADDRESS,
                    seller: item.seller,
                    buyer: address,
                    contractAddress: item.contractAddress,
                    tokenId: item.tokenId,
                    expectedErc1155Quantity,
                    erc1155PurchaseQuantity,
                    desiredErc1155Quantity: item.desiredErc1155Quantity || undefined,
                });

                if (!result.success) {
                    throw new Error(result.error || 'Purchase failed');
                }

                removeFromCart(item.listingId);
            }

            clearCart();
            router.push('/wallet');

        } catch (error) {
            devLog.error('cart', 'Batch purchase failed:', error);
            alert('Batch purchase failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Not connected state
    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto px-8 py-16">
                <EmptyState
                    icon="🔒"
                    title="Wallet Connection Required"
                    description="Please connect your wallet to view your shopping cart."
                />
            </div>
        );
    }

    // Empty cart state
    if (itemCount === 0) {
        return (
            <div className="max-w-4xl mx-auto px-8 py-16">
                <EmptyState
                    icon="🛒"
                    title="Your cart is empty"
                    description="Add some NFTs to your cart to get started with batch purchasing!"
                    action={{
                        label: 'Browse Marketplace',
                        onClick: () => router.push('/marketplace')
                    }}
                />
            </div>
        );
    }

    // Cart with items
    return (
        <div className="max-w-6xl mx-auto px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                                {itemCount > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {enrichedItems.map((item) => (
                                <div key={item.listingId} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-4">
                                        {/* NFT Image */}
                                        <div className="flex-shrink-0">
                                            {item.contractAddress && item.imageUrl ? (
                                                <Link href={`/nft/${item.contractAddress}/${item.tokenId}`}>
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden relative">
                                                        <OptimizedNFTImage
                                                            imageUrl={item.imageUrl}
                                                            tokenId={item.tokenId}
                                                            alt={item.name || `NFT #${item.tokenId}`}
                                                            className="object-cover rounded-lg"
                                                            width={80}
                                                            height={80}
                                                        />
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden">
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                        {item.contractAddress ? 'Loading...' : 'Invalid NFT'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* NFT Details */}
                                        <div className="flex-1 min-w-0">
                                            {item.contractAddress ? (
                                                <Link href={`/nft/${item.contractAddress}/${item.tokenId}`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                                                            {item.name || `NFT #${item.tokenId}`}
                                                        </h3>
                                                        {item.tokenStandard === 'ERC1155' && (
                                                            <span
                                                                className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${item.partialBuyEnabled
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                                                    }`}
                                                            >
                                                                {item.partialBuyEnabled ? 'Partial Buy Enabled' : 'Partial Buy Disabled'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            ) : (
                                                <h3 className="text-sm font-medium text-gray-500 truncate">
                                                    {item.name || `NFT #${item.tokenId}`} (Invalid)
                                                </h3>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Token ID: {item.tokenId}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {item.contractAddress ? `${item.contractAddress.slice(0, 6)}...${item.contractAddress.slice(-4)}` : 'Invalid Address'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Seller: {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Fees: Marketplace {((item.feeRate !== undefined && item.feeRate !== null
                                                    ? Number(item.feeRate) / 1000
                                                    : innovationFeePercentage * 100)).toFixed(2)}% · Creator {(royaltyPercentageByListingId[item.listingId] ?? item.royaltyFeePercentage ?? 0).toFixed(2)}%
                                            </p>
                                            {item.tokenStandard === 'ERC1155' && (
                                                <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
                                                    <p className="text-xs text-purple-800 mb-1">
                                                        ERC1155 quantity (available: {item.remainingQuantity || item.erc1155QuantityListed || '0'})
                                                    </p>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={(() => {
                                                            const maxRaw = item.remainingQuantity || item.erc1155QuantityListed || '0';
                                                            const maxQty = parseInt(maxRaw, 10);
                                                            return Number.isFinite(maxQty) && maxQty > 0 ? maxQty : undefined;
                                                        })()}
                                                        value={(() => {
                                                            const selected = quantityByListingId.get(item.listingId);
                                                            return selected && selected > 0 ? String(selected) : '1';
                                                        })()}
                                                        onChange={(event) => {
                                                            if (!item.partialBuyEnabled) return;
                                                            const raw = event.target.value.replace(/\D/g, '');
                                                            const maxRaw = item.remainingQuantity || item.erc1155QuantityListed || '0';
                                                            const maxQty = parseInt(maxRaw, 10);
                                                            const nextValue = raw === '' ? '1' : raw;
                                                            const parsed = parseInt(nextValue, 10);

                                                            if (!Number.isFinite(parsed) || parsed <= 0) return;
                                                            if (Number.isFinite(maxQty) && maxQty > 0 && parsed > maxQty) {
                                                                setErc1155PurchaseQuantities((prev) => ({ ...prev, [item.listingId]: String(maxQty) }));
                                                                updateCartItem(item.listingId, { desiredErc1155Quantity: String(maxQty) });
                                                                return;
                                                            }

                                                            setErc1155PurchaseQuantities((prev) => ({ ...prev, [item.listingId]: String(parsed) }));
                                                            updateCartItem(item.listingId, { desiredErc1155Quantity: String(parsed) });
                                                        }}
                                                        disabled={!item.partialBuyEnabled}
                                                        className={`w-28 rounded border px-2 py-1 text-xs ${item.partialBuyEnabled ? 'bg-white border-purple-300' : 'bg-purple-100 border-purple-200 text-purple-700'}`}
                                                    />
                                                    {!item.partialBuyEnabled && (
                                                        <p className="text-[11px] text-purple-700 mt-1">Partial buy disabled, full quantity required.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Price & Actions */}
                                        <div className="flex flex-col items-end justify-between">
                                            <div className="text-right">
                                                {(() => {
                                                    const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                                                    const decimals = getTokenDecimalsByAddress(chainId || 11155111, item.currency);
                                                    const quantity = quantityByListingId.get(item.listingId) || 1;
                                                    let priceWei = BigInt(item.price);
                                                    if (item.tokenStandard === 'ERC1155' && item.unitPrice) {
                                                        priceWei = BigInt(item.unitPrice) * BigInt(quantity);
                                                    }
                                                    const amount = formatTokenDisplay(formatUnits(priceWei, decimals), decimals);

                                                    return (
                                                        <div className="inline-grid grid-cols-[1fr_3.5rem] items-baseline gap-2">
                                                            <span className="text-lg font-bold text-gray-900 tabular-nums text-right">{amount}</span>
                                                            <span className="text-sm font-semibold text-gray-700 text-left">{symbol}</span>
                                                        </div>
                                                    );
                                                })()}
                                                {item.tokenStandard === 'ERC1155' && item.unitPrice && (
                                                    <p className="text-xs text-gray-500 tabular-nums">
                                                        Unit: {(() => {
                                                            const symbol = getCurrencySymbolByAddress(chainId || 11155111, item.currency);
                                                            const decimals = getTokenDecimalsByAddress(chainId || 11155111, item.currency);
                                                            return `${formatTokenDisplay(formatUnits(BigInt(item.unitPrice), decimals), decimals)} ${symbol}`;
                                                        })()}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.listingId)}
                                                className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-24">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Items ({itemCount})</span>
                                    {renderTokenRows(totalPriceByToken)}
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Marketplace Fee</span>
                                    {renderTokenRows(marketplaceFeeTotalsByToken)}
                                </div>

                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Marketplace Rate</span>
                                    <span className="font-medium text-gray-700">{feeRatesSummary.marketplaceLabel}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Creator Royalty</span>
                                    {renderTokenRows(creatorRoyaltyTotalsByToken)}
                                </div>

                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Creator Rate</span>
                                    <span className="font-medium text-gray-700">{feeRatesSummary.creatorLabel}</span>
                                </div>

                                {feeRatesSummary.isMixed && (
                                    <p className="text-[11px] text-gray-500">Fee rates vary by item.</p>
                                )}

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Fees</span>
                                    {renderTokenRows(feeTotalsByToken)}
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Estimated Gas</span>
                                    <span className="font-medium text-gray-900">{estimatedGasInfo}</span>
                                </div>

                                <hr className="border-gray-200" />

                                <div className="flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">Total</span>
                                    {renderTokenRows(totalSummaryByToken, 'text-lg font-bold text-gray-900')}
                                </div>
                            </div>

                            {/* Benefits */}
                            {itemCount > 1 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm">
                                            <p className="font-medium text-green-800">Batch Purchase Workflow</p>
                                            <ul className="mt-2 text-green-700 space-y-1">
                                                <li>• Guided item-by-item purchase confirmations</li>
                                                <li>• Cart keeps all selected NFTs in one place</li>
                                                <li>• 1inch preparation helps avoid failed purchases</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {swapRelevantCurrencies.length > 0 && (
                                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <h3 className="text-sm font-semibold text-indigo-900 mb-3">1inch Payment Preparation</h3>
                                    <p className="text-xs text-indigo-800 mb-3">
                                        Same guided flow as Buy Now: check deficit, swap, then continue purchase.
                                    </p>

                                    <div className="space-y-3">
                                        {swapRelevantCurrencies.map((entry) => {
                                            const deficit = currencyDeficitBySymbol[entry.symbol] || 0;
                                            const balance = tokenBalanceBySymbol[entry.symbol] || 0;
                                            const oneWethRate = oneWethRateBySymbol[entry.symbol] || 0;
                                            const status = swapStatusBySymbol[entry.symbol];
                                            const isReady = deficit <= 0.000001;
                                            const isActive = activeSwapSymbol === entry.symbol;
                                            const slippageValue = swapSlippageBySymbol[entry.symbol] || '1';

                                            return (
                                                <div key={entry.symbol} className="bg-white border border-indigo-200 rounded-md p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-semibold text-gray-900">Paying with {entry.symbol}</p>
                                                        <p className={`text-xs font-medium ${isReady ? 'text-green-700' : 'text-orange-700'}`}>
                                                            {isReady ? 'Ready' : `Missing ${deficit.toFixed(4)} ${entry.symbol}`}
                                                        </p>
                                                    </div>

                                                    <div className="mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded text-[11px] text-gray-700 space-y-1">
                                                        <div className="flex justify-between">
                                                            <span>1. Required for cart</span>
                                                            <span className="font-medium">{entry.totalRequired.toFixed(4)} {entry.symbol}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>2. Your current balance</span>
                                                            <span className="font-medium">{balance.toFixed(4)} {entry.symbol}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>3. Swap status</span>
                                                            <span className={`font-medium ${isReady || status?.state === 'success' ? 'text-green-700' : 'text-orange-700'}`}>
                                                                {isReady || status?.state === 'success' ? 'Done' : 'Needed'}
                                                            </span>
                                                        </div>
                                                        {oneWethRate > 0 && (
                                                            <div className="flex justify-between">
                                                                <span>Reference rate</span>
                                                                <span className="font-medium">1 WETH ≈ {oneWethRate.toFixed(4)} {entry.symbol}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                        <div>
                                                            <label className="block text-[11px] text-indigo-700 mb-1">Source (WETH)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.0001"
                                                                value={swapSourceAmountBySymbol[entry.symbol] || '0.01'}
                                                                onChange={(event) => setSwapSourceAmountBySymbol((prev) => ({ ...prev, [entry.symbol]: event.target.value }))}
                                                                className="w-full rounded border border-indigo-300 px-2 py-1.5 text-xs"
                                                                placeholder="WETH amount"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] text-indigo-700 mb-1">Slippage (%)</label>
                                                            <input
                                                                type="number"
                                                                min="0.1"
                                                                max="50"
                                                                step="0.1"
                                                                value={slippageValue}
                                                                onChange={(event) => setSwapSlippageBySymbol((prev) => ({ ...prev, [entry.symbol]: event.target.value }))}
                                                                className="w-full rounded border border-indigo-300 px-2 py-1.5 text-xs"
                                                                placeholder="Slippage"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1.5 mb-2">
                                                        <button type="button" onClick={() => setSwapSlippageBySymbol((prev) => ({ ...prev, [entry.symbol]: '0.5' }))} className="px-2 py-0.5 rounded border border-indigo-300 text-indigo-700 text-[11px]">Safe</button>
                                                        <button type="button" onClick={() => setSwapSlippageBySymbol((prev) => ({ ...prev, [entry.symbol]: '1' }))} className="px-2 py-0.5 rounded border border-indigo-300 text-indigo-700 text-[11px]">Auto</button>
                                                        <button type="button" onClick={() => setSwapSlippageBySymbol((prev) => ({ ...prev, [entry.symbol]: '2' }))} className="px-2 py-0.5 rounded border border-indigo-300 text-indigo-700 text-[11px]">Fast</button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrepareAndExecuteCurrencySwap(entry)}
                                                        disabled={isSigningSwapTx || isActive || isReady}
                                                        className="w-full px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isActive && 'Processing...'}
                                                        {!isActive && isSigningSwapTx && 'Sign in wallet...'}
                                                        {!isActive && !isSigningSwapTx && isReady && 'Swap not required'}
                                                        {!isActive && !isSigningSwapTx && !isReady && 'Swap & Continue'}
                                                    </button>

                                                    {status?.message && (
                                                        <p className={`text-[11px] mt-1 ${status.state === 'error' ? 'text-red-600' : status.state === 'success' ? 'text-green-700' : 'text-indigo-700'}`}>
                                                            {status.message}
                                                        </p>
                                                    )}
                                                    {status?.txHash && (
                                                        <p className="text-[10px] text-gray-500 mt-1 break-all">tx: {status.txHash}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {hasUnpreparedSwapRequirement ? (
                                        <p className="text-[11px] text-indigo-800 mt-3">Complete all required swaps above, then continue with batch purchase.</p>
                                    ) : (
                                        <p className="text-[11px] text-green-700 mt-3">All payment tokens are ready for batch purchase.</p>
                                    )}
                                </div>
                            )}

                            {/* Purchase Button */}
                            <button
                                onClick={handleBatchPurchase}
                                disabled={isProcessing || itemCount === 0 || hasUnpreparedSwapRequirement}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                            >
                                {isProcessing ? (
                                    <>
                                        <ButtonSpinner className="-ml-1 mr-3" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {hasUnpreparedSwapRequirement ? 'Prepare payment tokens first' : 'Start Item-by-Item Purchase'}
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Your wallet will prompt you to confirm the transaction
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}