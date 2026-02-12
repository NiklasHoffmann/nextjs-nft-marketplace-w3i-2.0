// utils/04-blockchain/04-blockchain-nft-fetcher.ts
import { devLog } from '@/utils';
import {
    executeOptionalCall,
    executeBatchContractCalls
} from './contract-calls';
import {
    contractPropertiesCache,
    ownershipCache,
    tokenMetadataCache,
    approvalCache,
    getCacheKeys,
    type ContractProperties,
    type OwnershipData,
    type TokenMetadata
} from '@/services/cache/smart-cache';

// Comprehensive NFT data interface
interface BlockchainNFTData {
    tokenURI?: string;
    owner?: string;
    contractName?: string;
    contractSymbol?: string;
    totalSupply?: string;
    ownerBalance?: string;
    approvedAddress?: string;
    tokenStandard?: 'ERC721' | 'ERC1155';
}

function normalizeErc1155TokenUri(tokenUri: string, tokenId: bigint): string {
    const hexTokenId = tokenId.toString(16).padStart(64, '0');
    return tokenUri.replace(/\{id\}/gi, hexTokenId);
}

/**
 * Temporäre neue fetchComprehensiveNFTData Funktion mit intelligentem Caching
 * Fetches comprehensive NFT data from blockchain
 */
export async function fetchComprehensiveNFTDataNew(
    contractAddress: string,
    tokenId: string,
    ownerAddress?: string
): Promise<BlockchainNFTData | undefined> {
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

        const ERC1155_ABI = [
            {
                name: 'uri',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: '', type: 'string' }],
            },
            {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                    { name: 'account', type: 'address' },
                    { name: 'id', type: 'uint256' }
                ],
                outputs: [{ name: '', type: 'uint256' }],
            },
        ] as const;

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
            devLog.error('nft-fetcher', 'Invalid NFT address format');
            return undefined;
        }

        // Convert tokenId to BigInt with validation
        let tokenIdBigInt: bigint;
        try {
            tokenIdBigInt = BigInt(tokenId);
        } catch (error) {
            devLog.error('nft-fetcher', 'Invalid tokenId - must be a valid number');
            return undefined;
        }

        const contractAddr = contractAddress as `0x${string}`;

        // ✨ STEP 1: Check Cache für Contract Properties (Name, Symbol, Total Supply)
        const contractCacheKey = getCacheKeys.contractProperties(contractAddress);
        let contractProperties = contractPropertiesCache.get(contractCacheKey);

        if (!contractProperties) {

            // Fetch only contract-level properties
            const contractCalls = [
                {
                    address: contractAddr,
                    abi: ERC721_ABI,
                    functionName: 'name',
                    args: [],
                    callType: 'optional' as const
                },
                {
                    address: contractAddr,
                    abi: ERC721_ABI,
                    functionName: 'symbol',
                    args: [],
                    callType: 'optional' as const
                },
                {
                    address: contractAddr,
                    abi: ERC721_ABI,
                    functionName: 'totalSupply',
                    args: [],
                    callType: 'optional' as const
                }
            ];

            const { results } = await executeBatchContractCalls(contractCalls);

            contractProperties = {
                contractAddress: contractAddress,
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
        const tokenCacheKey = getCacheKeys.tokenMetadata(contractAddress, tokenId);
        let tokenMetadata = tokenMetadataCache.get(tokenCacheKey);

        let tokenStandard: 'ERC721' | 'ERC1155' | undefined;

        if (!tokenMetadata) {
            const tokenUri721 = await executeOptionalCall<string>({
                address: contractAddr,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [tokenIdBigInt],
            });

            let resolvedTokenUri = tokenUri721 || undefined;

            if (resolvedTokenUri) {
                tokenStandard = 'ERC721';
            } else {
                const tokenUri1155 = await executeOptionalCall<string>({
                    address: contractAddr,
                    abi: ERC1155_ABI,
                    functionName: 'uri',
                    args: [tokenIdBigInt],
                });

                if (tokenUri1155) {
                    tokenStandard = 'ERC1155';
                    resolvedTokenUri = normalizeErc1155TokenUri(tokenUri1155, tokenIdBigInt);
                }
            }

            if (!resolvedTokenUri) {
                devLog.error('nft-fetcher', '❌ tokenURI/uri call failed');
                return undefined;
            }

            tokenMetadata = {
                contractAddress: contractAddress,
                tokenId,
                tokenURI: resolvedTokenUri,
                tokenStandard,
                cached: false,
                cachedAt: Date.now()
            };

            // Cache für 12 Stunden
            tokenMetadataCache.set(tokenCacheKey, tokenMetadata);

        } else {

            tokenMetadata.cached = true;
            tokenStandard = tokenMetadata.tokenStandard;
            if (!tokenStandard) {
                tokenStandard = tokenMetadata.tokenURI?.includes('{id}') ? 'ERC1155' : 'ERC721';
            }
        }

        // ✨ STEP 3: Check Cache für Ownership Data (Owner, Balance) - kürzeres Caching
        let ownershipData: OwnershipData | undefined;
        const isErc1155 = tokenStandard === 'ERC1155';

        if (!isErc1155) {
            const ownershipCacheKey = getCacheKeys.ownership(contractAddress, tokenId);
            ownershipData = ownershipCache.get(ownershipCacheKey);

            if (!ownershipData) {
                const ownershipCalls = [
                    {
                        address: contractAddr,
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
                        address: contractAddr,
                        abi: ERC721_ABI,
                        functionName: 'balanceOf',
                        args: [owner as `0x${string}`],
                    });
                    ownerBalance = balanceResult?.toString();
                }

                ownershipData = {
                    contractAddress: contractAddress,
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
        } else {
            let ownerBalance: string | undefined;
            if (ownerAddress) {
                const balanceResult = await executeOptionalCall<bigint>({
                    address: contractAddr,
                    abi: ERC1155_ABI,
                    functionName: 'balanceOf',
                    args: [ownerAddress as `0x${string}`, tokenIdBigInt],
                });
                ownerBalance = balanceResult?.toString();
            }

            ownershipData = {
                contractAddress: contractAddress,
                tokenId,
                owner: ownerAddress,
                ownerBalance,
                cached: false,
                cachedAt: Date.now()
            };
        }

        // ✨ STEP 4: Check Cache für Approval Status - sehr kurzes Caching
        let approvedAddress: string | undefined;
        if (!isErc1155) {
            const approvalCacheKey = getCacheKeys.approval(contractAddress, tokenId);
            approvedAddress = approvalCache.get(approvalCacheKey);

            if (!approvedAddress) {
                const approvalResult = await executeOptionalCall<string>({
                    address: contractAddr,
                    abi: ERC721_ABI,
                    functionName: 'getApproved',
                    args: [tokenIdBigInt],
                });

                approvedAddress = approvalResult || '';

                // Cache für 2 Minuten (Approvals ändern sich häufig)
                approvalCache.set(approvalCacheKey, approvedAddress);
            }
        }

        return {
            tokenURI: tokenMetadata.tokenURI,
            owner: ownershipData.owner,
            contractName: contractProperties.name,
            contractSymbol: contractProperties.symbol,
            totalSupply: contractProperties.totalSupply,
            ownerBalance: ownershipData.ownerBalance,
            approvedAddress: approvedAddress || undefined,
            tokenStandard,
        };

    } catch (error) {
        devLog.error('nft-fetcher', 'Error fetching comprehensive NFT data:', error);
        return undefined;
    }
}
