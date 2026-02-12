import { NextRequest } from 'next/server';
import { apiBadRequest, apiHandler, apiSuccess } from '@/lib/api';
import { getWalletNFTsFromBlockchain, getKnownContractAddresses } from '@/lib/blockchain';
import type { Address } from 'viem';
import { devLog } from '@/utils';

// Interface for NFT response from external APIs
interface ExternalNFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    description?: string;
    image?: string;
    animationUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    contractName?: string;
    contractSymbol?: string;
    tokenType?: 'ERC721' | 'ERC1155';
    balance?: string; // For ERC1155
}

interface WalletNFTsResponse {
    success: boolean;
    data?: ExternalNFT[];
    total?: number;
    error?: string;
    source?: 'alchemy' | 'moralis' | 'blockchain' | 'hybrid';
}



// Lightweight NFT discovery interface
interface NFTIdentifier {
    contractAddress: string;
    tokenId: string;
}

/**
 * Alchemy API - LIGHTWEIGHT MODE (Rate Limit Friendly)
 * Only fetches contract addresses + token IDs (minimal data)
 * Metadata is fetched separately via blockchain + IPFS
 */
async function discoverNFTsViaAlchemy(walletAddress: string): Promise<NFTIdentifier[]> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
        if (!apiKey) {
            throw new Error('Alchemy API key not configured. Please set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local');
        }

        const baseURL = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}`;

        // IMPORTANT: withMetadata=false to save rate limit!
        const response = await fetch(
            `${baseURL}/getNFTsForOwner?owner=${walletAddress}&withMetadata=false&pageSize=100`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            devLog.error('? Alchemy API error:', response.status, errorText);
            throw new Error(`Alchemy API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Debug: Log Alchemy response
        devLog.info(`\n?? [Alchemy Discovery] Response for ${walletAddress}:`);
        devLog.info(`  - Total NFTs: ${data.ownedNfts?.length || 0}`);
        devLog.info(`  - Page Key: ${data.pageKey || 'none'}`);
        if (data.ownedNfts && data.ownedNfts.length > 0) {
            const firstNFT = data.ownedNfts[0];
            devLog.info(`  - First NFT contract:`, firstNFT.contract);
            devLog.info(`  - First NFT contract.address:`, firstNFT.contract?.address);
            devLog.info(`  - First NFT tokenId:`, firstNFT.tokenId);
            devLog.info(`  - First NFT id:`, firstNFT.id);
            devLog.info(`  - Full first NFT structure:`, JSON.stringify(firstNFT, null, 2));
        }
        devLog.info('');

        // Only extract contract + tokenId (minimal data)
        const nfts = data.ownedNfts?.map((nft: any) => {
            // CRITICAL FIX: Alchemy v3 has contract.address (NOT contract itself)
            const contractAddress = nft.contract?.address || nft.contractAddress;
            const tokenId = nft.tokenId || nft.id?.tokenId;

            if (!contractAddress || !tokenId) {
                devLog.warn(`?? Skipping NFT with missing data. Contract:`, nft.contract, `TokenId:`, tokenId);
                return null;
            }

            return {
                contractAddress: contractAddress.toLowerCase(),
                tokenId: tokenId.toString(), // Ensure string
            };
        }).filter(Boolean) || [];

        devLog.info(`? [Alchemy Discovery] Mapped ${nfts.length} NFTs`);
        return nfts as NFTIdentifier[];
    } catch (error) {
        devLog.error('? [Alchemy Discovery] Error:', error);
        throw error;
    }
}

/**
 * DEPRECATED: Old Alchemy with full metadata
 * Use discoverNFTsViaAlchemy() + blockchain fetching instead
 */
async function fetchFromAlchemy(walletAddress: string): Promise<ExternalNFT[]> {
    // Use your specific Alchemy API key from .env.local
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
        throw new Error('Alchemy API key not configured. Please set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local');
    }

    // Use Sepolia network as configured in your .env.local
    const baseURL = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}`;

    const response = await fetch(
        `${baseURL}/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=100`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        devLog.error('❌ Alchemy API error:', response.status, errorText);
        throw new Error(`Alchemy API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.ownedNfts?.map((nft: any) => {
        // Skip if NFT is undefined or invalid
        if (!nft || !nft.contract) {
            devLog.warn('⚠️ Skipping invalid NFT:', nft);
            return null;
        }

        // Handle image URL - could be string or object
        let imageUrl: string | undefined;
        if (typeof nft.image === 'string') {
            imageUrl = nft.image;
        } else if (nft.image && typeof nft.image === 'object') {
            imageUrl = nft.image.originalUrl || nft.image.cachedUrl || nft.image.thumbnailUrl || nft.image.pngUrl;
        }
        // Fallback to raw.metadata.image if available
        if (!imageUrl && nft?.raw?.metadata?.image) {
            imageUrl = typeof nft.raw.metadata.image === 'string'
                ? nft.raw.metadata.image
                : undefined;
        }

        return {
            contractAddress: nft.contract.address,
            tokenId: nft.tokenId,
            name: nft.name || nft.title || `NFT #${nft.tokenId}`,
            description: nft.description,
            image: imageUrl,
            animationUrl: nft.animation_url,
            attributes: nft.attributes || [],
            contractName: nft.contract.name,
            contractSymbol: nft.contract.symbol,
            tokenType: nft.contract.tokenType,
            balance: nft.balance
        };
    }).filter(Boolean) || [];
}

// Moralis API integration (alternative)
async function fetchFromMoralis(walletAddress: string): Promise<ExternalNFT[]> {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
        throw new Error('Moralis API key not configured. Add MORALIS_API_KEY to .env.local if you want to use Moralis as fallback');
    }

    // Use Sepolia chain to match your setup
    const chain = process.env.MORALIS_CHAIN || 'sepolia';


    const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft?chain=${chain}&format=decimal&media_items=true`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': apiKey
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        devLog.error('❌ Moralis API error:', response.status, errorText);
        throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.result?.map((nft: any) => ({
        contractAddress: nft.token_address,
        tokenId: nft.token_id,
        name: nft.metadata?.name || `NFT #${nft.token_id}`,
        description: nft.metadata?.description,
        image: nft.metadata?.image,
        animationUrl: nft.metadata?.animation_url,
        attributes: nft.metadata?.attributes || [],
        contractName: nft.name,
        contractSymbol: nft.symbol,
        tokenType: nft.contract_type,
        balance: nft.amount
    })) || [];
}

// GET /api/wallet/nfts - Get all NFTs for a wallet address
export const GET = apiHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    const source = searchParams.get('source') || 'auto'; // 'alchemy', 'moralis', 'auto'

    // Validation
    if (!walletAddress) {
        return apiBadRequest('Wallet address is required');
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return apiBadRequest('Invalid wallet address format');
    }

    let nfts: ExternalNFT[] = [];
    let usedSource: 'alchemy' | 'moralis' | 'blockchain' | 'hybrid' = 'blockchain';

    try {
        const startTime = Date.now();

        // Strategy: Parallel execution for 'auto' mode (best performance)
        // - Blockchain: Known marketplace contracts (fast, no rate limits)
        // - Alchemy: Complete wallet inventory (1 API call)

        let blockchainNFTs: ExternalNFT[] = [];
        let alchemyNFTs: ExternalNFT[] = [];

        // PARALLEL execution in auto mode for best performance
        if (source === 'auto') {
            devLog.info('?? [Hybrid] Starting parallel fetch: Blockchain + Alchemy Discovery');

            const [blockchainResult, alchemyDiscoveryResult] = await Promise.allSettled([
                // Step 1: Blockchain query (known contracts with full metadata)
                (async () => {
                    const contracts = await getKnownContractAddresses();
                    devLog.info(`  ? Found ${contracts.length} known contracts in marketplace`);
                    if (contracts.length === 0) return [];

                    const bcNFTs = await getWalletNFTsFromBlockchain(
                        walletAddress as Address,
                        contracts
                    );
                    return bcNFTs.map(nft => ({
                        contractAddress: nft.contractAddress,
                        tokenId: nft.tokenId,
                        name: nft.name,
                        description: nft.description,
                        image: nft.image,
                        animationUrl: undefined,
                        attributes: [],
                        contractName: nft.contractName,
                        contractSymbol: nft.contractSymbol,
                        tokenType: 'ERC721' as const,
                    }));
                })(),
                // Step 2: Alchemy discovery (lightweight - only contract+tokenId)
                discoverNFTsViaAlchemy(walletAddress)
            ]);

            // Process blockchain result (known contracts)
            if (blockchainResult.status === 'fulfilled') {
                blockchainNFTs = blockchainResult.value;
                devLog.info(`? Blockchain: ${blockchainNFTs.length} NFTs from known contracts (${Date.now() - startTime}ms)`);
            } else {
                devLog.warn('?? Blockchain query failed:', blockchainResult.reason);
            }

            // Process Alchemy discovery result
            if (alchemyDiscoveryResult.status === 'fulfilled') {
                const discoveredNFTs = alchemyDiscoveryResult.value;
                devLog.info(`? Alchemy Discovery: ${discoveredNFTs.length} NFTs found`);

                // Step 3: Filter out already-fetched NFTs
                const knownKeys = new Set(
                    blockchainNFTs.map(nft => `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`)
                );

                const unknownNFTs = discoveredNFTs.filter(nft => {
                    const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
                    return !knownKeys.has(key);
                });

                devLog.info(`  ? ${unknownNFTs.length} unknown NFTs (not in marketplace contracts)`);

                // Step 4: Fetch metadata for unknown NFTs via blockchain + IPFS
                if (unknownNFTs.length > 0) {
                    const unknownContracts = [...new Set(unknownNFTs.map(n => n.contractAddress))] as Address[];
                    devLog.info(`  ? Fetching metadata from ${unknownContracts.length} additional contracts...`);

                    try {
                        const additionalNFTs = await getWalletNFTsFromBlockchain(
                            walletAddress as Address,
                            unknownContracts
                        );

                        alchemyNFTs = additionalNFTs.map(nft => ({
                            contractAddress: nft.contractAddress,
                            tokenId: nft.tokenId,
                            name: nft.name,
                            description: nft.description,
                            image: nft.image,
                            animationUrl: undefined,
                            attributes: [],
                            contractName: nft.contractName,
                            contractSymbol: nft.contractSymbol,
                            tokenType: 'ERC721' as const,
                        }));

                        devLog.info(`? Additional NFTs: ${alchemyNFTs.length} NFTs fetched via blockchain+IPFS`);
                    } catch (fetchError) {
                        devLog.error('? Failed to fetch additional NFTs:', fetchError);
                        alchemyNFTs = [];
                    }
                }
            } else {
                devLog.error('? Alchemy discovery failed:', alchemyDiscoveryResult.reason);
                devLog.error('   Error details:', JSON.stringify(alchemyDiscoveryResult.reason, null, 2));
                // No fallback - blockchain-only mode is fine
            }
        }
        // SEQUENTIAL execution for specific source modes
        else if (source === 'blockchain') {
            devLog.info('?? Using blockchain-only mode');
            const contracts = await getKnownContractAddresses();
            devLog.info(`  ? ${contracts.length} known contracts`);

            if (contracts.length > 0) {
                const bcNFTs = await getWalletNFTsFromBlockchain(
                    walletAddress as Address,
                    contracts
                );
                blockchainNFTs = bcNFTs.map(nft => ({
                    contractAddress: nft.contractAddress,
                    tokenId: nft.tokenId,
                    name: nft.name,
                    description: nft.description,
                    image: nft.image,
                    animationUrl: undefined,
                    attributes: [],
                    contractName: nft.contractName,
                    contractSymbol: nft.contractSymbol,
                    tokenType: 'ERC721' as const,
                }));
                devLog.info(`? Found ${blockchainNFTs.length} NFTs via blockchain`);
            }
        }
        else if (source === 'alchemy') {
            alchemyNFTs = await fetchFromAlchemy(walletAddress);
            devLog.info(`? Found ${alchemyNFTs.length} NFTs via Alchemy`);
        }
        else if (source === 'moralis') {
            alchemyNFTs = await fetchFromMoralis(walletAddress);
            devLog.info(`? Found ${alchemyNFTs.length} NFTs via Moralis`);
        }

        // SIMPLE MERGE: Combine both lists (no deduplication needed now)
        if (source === 'auto' && (blockchainNFTs.length > 0 || alchemyNFTs.length > 0)) {
            // In new mode: blockchain + additional (non-overlapping)
            nfts = [...blockchainNFTs, ...alchemyNFTs];
            usedSource = 'hybrid';

            const totalTime = Date.now() - startTime;
            devLog.info(`? [Hybrid] ${nfts.length} total NFTs (${blockchainNFTs.length} known + ${alchemyNFTs.length} additional) in ${totalTime}ms`);
        } else if (blockchainNFTs.length > 0) {
            nfts = blockchainNFTs;
            usedSource = 'blockchain';
            devLog.info(`? Blockchain-only: ${nfts.length} NFTs in ${Date.now() - startTime}ms`);
        } else if (alchemyNFTs.length > 0) {
            nfts = alchemyNFTs;
            usedSource = 'alchemy';
            devLog.info(`? Alchemy-only: ${nfts.length} NFTs in ${Date.now() - startTime}ms`);
        }

        // Empty result is OK (wallet might be empty)

    } catch (apiError) {
        devLog.error('❌ API request failed:', apiError);
        throw apiError;
    }

    const response: WalletNFTsResponse = {
        success: true,
        data: nfts,
        total: nfts.length,
        source: usedSource
    };

    return apiSuccess(response);
});

export { type ExternalNFT, type WalletNFTsResponse };
