// utils/04-blockchain/04-blockchain-nft-fetcher.ts
import {
    executeCriticalCall,
    executeOptionalCall,
    executeBatchContractCalls
} from './03-blockchain-contract-calls';
import {
    contractPropertiesCache,
    ownershipCache,
    tokenMetadataCache,
    approvalCache,
    getCacheKeys,
    type ContractProperties,
    type OwnershipData,
    type TokenMetadata
} from './06-blockchain-smart-cache';

// Comprehensive NFT data interface
interface BlockchainNFTData {
    tokenURI?: string;
    owner?: string;
    contractName?: string;
    contractSymbol?: string;
    totalSupply?: string;
    ownerBalance?: string;
    approvedAddress?: string;
}

// Temporäre neue fetchComprehensiveNFTData Funktion mit intelligentem Caching
export async function fetchComprehensiveNFTDataNew(nftAddress: string, tokenId: string): Promise<BlockchainNFTData | undefined> {
    try {
        // Enhanced ERC721 ABI mit allen wichtigen Funktionen
        const ERC721_ABI = [
            {
                name: 'tokenURI',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: '', type: 'string' }],
            },
            {
                name: 'ownerOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: '', type: 'address' }],
            },
            {
                name: 'name',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ name: '', type: 'string' }],
            },
            {
                name: 'symbol',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ name: '', type: 'string' }],
            },
            {
                name: 'totalSupply',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ name: '', type: 'uint256' }],
            },
            {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'owner', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }],
            },
            {
                name: 'getApproved',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: '', type: 'address' }],
            },
        ] as const;

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(nftAddress)) {
            console.error('Invalid NFT address format');
            return undefined;
        }

        // Convert tokenId to BigInt with validation
        let tokenIdBigInt: bigint;
        try {
            tokenIdBigInt = BigInt(tokenId);
        } catch (error) {
            console.error('Invalid tokenId - must be a valid number');
            return undefined;
        }

        const contractAddress = nftAddress as `0x${string}`;

        // ✨ STEP 1: Check Cache für Contract Properties (Name, Symbol, Total Supply)
        const contractCacheKey = getCacheKeys.contractProperties(nftAddress);
        let contractProperties = contractPropertiesCache.get(contractCacheKey);

        if (!contractProperties) {

            // Fetch only contract-level properties
            const contractCalls = [
                {
                    address: contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'name',
                    args: [],
                    callType: 'optional' as const
                },
                {
                    address: contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'symbol',
                    args: [],
                    callType: 'optional' as const
                },
                {
                    address: contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'totalSupply',
                    args: [],
                    callType: 'optional' as const
                }
            ];

            const { results } = await executeBatchContractCalls(contractCalls);

            contractProperties = {
                contractAddress: nftAddress,
                name: results[0]?.success ? results[0].data as string : undefined,
                symbol: results[1]?.success ? results[1].data as string : undefined,
                totalSupply: results[2]?.success ? results[2].data?.toString() : undefined,
                cached: false,
                cachedAt: Date.now()
            };

            // Cache für 24 Stunden
            contractPropertiesCache.set(contractCacheKey, contractProperties);

        } else {

            contractProperties.cached = true;
        }

        // ✨ STEP 2: Check Cache für Token Metadata (TokenURI)
        const tokenCacheKey = getCacheKeys.tokenMetadata(nftAddress, tokenId);
        let tokenMetadata = tokenMetadataCache.get(tokenCacheKey);

        if (!tokenMetadata) {

            const tokenURIResult = await executeCriticalCall<string>({
                address: contractAddress,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [tokenIdBigInt],
            });

            if (!tokenURIResult.success) {
                console.error('❌ Critical tokenURI call failed');
                return undefined;
            }

            tokenMetadata = {
                nftAddress,
                tokenId,
                tokenURI: tokenURIResult.data,
                cached: false,
                cachedAt: Date.now()
            };

            // Cache für 12 Stunden
            tokenMetadataCache.set(tokenCacheKey, tokenMetadata);

        } else {

            tokenMetadata.cached = true;
        }

        // ✨ STEP 3: Check Cache für Ownership Data (Owner, Balance) - kürzeres Caching
        const ownershipCacheKey = getCacheKeys.ownership(nftAddress, tokenId);
        let ownershipData = ownershipCache.get(ownershipCacheKey);

        if (!ownershipData) {

            const ownershipCalls = [
                {
                    address: contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'ownerOf',
                    args: [tokenIdBigInt],
                    callType: 'optional' as const
                }
            ];

            const { results } = await executeBatchContractCalls(ownershipCalls);
            const owner = results[0]?.success ? results[0].data as string : undefined;

            // Get owner's balance if we have the owner address
            let ownerBalance: string | undefined;
            if (owner) {
                const balanceResult = await executeOptionalCall<bigint>({
                    address: contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'balanceOf',
                    args: [owner as `0x${string}`],
                });
                ownerBalance = balanceResult?.toString();
            }

            ownershipData = {
                nftAddress,
                tokenId,
                owner,
                ownerBalance,
                cached: false,
                cachedAt: Date.now()
            };

            // Cache für 5 Minuten (Owner kann sich ändern)
            ownershipCache.set(ownershipCacheKey, ownershipData);

        } else {

            ownershipData.cached = true;
        }

        // ✨ STEP 4: Check Cache für Approval Status - sehr kurzes Caching
        const approvalCacheKey = getCacheKeys.approval(nftAddress, tokenId);
        let approvedAddress = approvalCache.get(approvalCacheKey);

        if (!approvedAddress) {

            const approvalResult = await executeOptionalCall<string>({
                address: contractAddress,
                abi: ERC721_ABI,
                functionName: 'getApproved',
                args: [tokenIdBigInt],
            });

            approvedAddress = approvalResult || '';

            // Cache für 2 Minuten (Approvals ändern sich häufig)
            approvalCache.set(approvalCacheKey, approvedAddress);
        }

        return {
            tokenURI: tokenMetadata.tokenURI,
            owner: ownershipData.owner,
            contractName: contractProperties.name,
            contractSymbol: contractProperties.symbol,
            totalSupply: contractProperties.totalSupply,
            ownerBalance: ownershipData.ownerBalance,
            approvedAddress: approvedAddress || undefined,
        };

    } catch (error) {
        console.error('Error fetching comprehensive NFT data:', error);
        return undefined;
    }
}