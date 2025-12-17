/**
 * Marketplace Fees Hook
 * 
 * Fetches dynamic fee rates from the marketplace contract
 */

'use client';

import { useReadContract } from 'wagmi';
import marketplaceAbi from '@/constants/marketplace.abi.json';

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
        abi: marketplaceAbi,
        functionName: 'getInnovationFee',
    });

    // Innovation fee is returned as uint32 in basis points (e.g., 250 = 2.5%)
    const innovationFee = innovationFeeData ? Number(innovationFeeData) : 250; // Default 2.5%
    const innovationFeePercentage = innovationFee / 10000;

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
    const royaltyBasisPoints = royaltyData ? Number(royaltyData[1]) : 750; // Default 7.5% if not available
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
