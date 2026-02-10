/**
 * Marketplace Fees Hook
 * 
 * Fetches dynamic fee rates from the marketplace contract
 */

'use client';

import { useReadContract } from 'wagmi';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';

interface UseMarketplaceFeesProps {
    marketplaceAddress: `0x${string}`;
    contractAddress?: `0x${string}`;
    tokenId?: string;
}

export function useMarketplaceFees({
    marketplaceAddress,
    contractAddress,
    tokenId
}: UseMarketplaceFeesProps) {
    // Get innovation fee (marketplace fee) from contract
    const { data: innovationFeeData } = useReadContract({
        address: marketplaceAddress,
        abi: GETTER_FACET_ABI,
        functionName: 'getInnovationFee',
    });

    // Innovation fee is returned as uint32 per 100000 (e.g., 1000 = 1%)
    const innovationFee = innovationFeeData ? Number(innovationFeeData) : 1000; // Default 1%
    const innovationFeePercentage = innovationFee / 100000;

    // Get royalty info from the NFT contract (ERC2981 standard)
    // We'll need to call royaltyInfo on the NFT contract
    const { data: royaltyData } = useReadContract({
        address: contractAddress,
        abi: [
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
        ],
        functionName: 'royaltyInfo',
        args: contractAddress && tokenId ? [BigInt(tokenId), BigInt(10000)] : undefined, // Use 10000 as base to calculate percentage
        query: {
            enabled: !!contractAddress && !!tokenId
        }
    });

    // Calculate royalty percentage from the returned amount
    // royaltyAmount is returned for a sale price of 10000, so we can directly use it as basis points
    const royaltyBasisPoints = royaltyData ? Number(royaltyData[1]) : 0; // Default 0% if not available (collection may not have royalties)
    const royaltyFeePercentage = royaltyBasisPoints / 10000;

    /**
     * Calculate fees for a given price
     */
    const calculateFees = (price: number) => {
        const marketplaceFee = price * innovationFeePercentage;
        const royaltyFee = price * royaltyFeePercentage;
        const totalFees = marketplaceFee + royaltyFee;
        const youReceive = price - totalFees;

        return {
            marketplaceFee,
            royaltyFee,
            totalFees,
            youReceive,
            marketplaceFeePercentage: innovationFeePercentage * 100,
            royaltyFeePercentage: royaltyFeePercentage * 100
        };
    };

    return {
        innovationFee, // Raw basis points
        innovationFeePercentage,
        royaltyBasisPoints,
        royaltyFeePercentage,
        calculateFees,
        isLoading: false // Could track loading states if needed
    };
}
