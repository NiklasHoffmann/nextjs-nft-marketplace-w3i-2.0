/**
 * Blockchain-based Wallet NFT Discovery
 * 
 * Alternative to Alchemy/Moralis APIs - queries blockchain directly
 * Uses Transfer events and contract calls to discover owned NFTs
 */

import { createPublicClient, decodeEventLog, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { getEnrichedNFTsCollection } from '@/lib/mongodb';
import { incrementRequestCounter } from '@/lib/monitoring/request-counter';
import { devLog } from '@/utils';

// ERC-721 ABI fragments we need
const ERC721_ABI = [
    {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'tokenOfOwnerByIndex',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint256' }
        ],
        outputs: [{ name: 'tokenId', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'tokenURI',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        type: 'function',
        name: 'name',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        type: 'function',
        name: 'symbol',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        type: 'function',
        name: 'ownerOf',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: 'owner', type: 'address' }],
    },
    {
        type: 'event',
        name: 'Transfer',
        inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true }
        ],
    },
] as const;

interface BlockchainNFT {
    contractAddress: string;
    tokenId: string;
    tokenURI?: string;
    name?: string;
    description?: string;
    image?: string;
    contractName?: string;
    contractSymbol?: string;
}

interface NFTMetadata {
    name?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

const EVENT_LOG_BLOCK_RANGE = BigInt(2_000);
const MAX_EVENT_LOG_REQUESTS = BigInt(20);

/**
 * Create public client with configured RPC endpoints
 */
function createClient() {
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
        'https://rpc.sepolia.org'; // Free public RPC as fallback

    devLog.info(`🔗 [Blockchain] Using RPC: ${rpcUrl.substring(0, 40)}...`);

    return createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl),
    });
}

/**
 * Fetch NFT metadata from tokenURI (IPFS or HTTP)
 * Optimized with timeout and better error handling
 */
async function fetchMetadata(tokenURI: string): Promise<NFTMetadata | null> {
    try {
        // Convert IPFS URLs to HTTP gateway
        let url = tokenURI;
        if (url.startsWith('ipfs://')) {
            url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
        } else if (url.startsWith('ipfs/')) {
            url = 'https://ipfs.io/ipfs/' + url.substring(5);
        }

        // Fetch with timeout and proper headers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'W3I-Marketplace/2.0'
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            devLog.warn(`Failed to fetch metadata from ${url}: ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            devLog.warn(`Invalid content type for ${url}: ${contentType}`);
            return null;
        }

        const metadata = await response.json();

        // Convert IPFS image URLs to HTTP gateway
        if (metadata.image) {
            if (metadata.image.startsWith('ipfs://')) {
                metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            } else if (metadata.image.startsWith('ipfs/')) {
                metadata.image = 'https://ipfs.io/ipfs/' + metadata.image.substring(5);
            }
        }

        // Also handle animation_url
        if (metadata.animation_url && metadata.animation_url.startsWith('ipfs://')) {
            metadata.animation_url = metadata.animation_url.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        return metadata;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            devLog.warn(`Metadata fetch timeout for ${tokenURI}`);
        } else {
            devLog.warn(`Error fetching metadata from ${tokenURI}:`, error);
        }
        return null;
    }
}

/**
 * Get NFTs owned by a wallet using blockchain queries
 * Optimized for performance with parallel execution and smart batching
 */
export async function getWalletNFTsFromBlockchain(
    walletAddress: Address,
    knownContracts: Address[]
): Promise<BlockchainNFT[]> {
    const client = createClient();
    const nfts: BlockchainNFT[] = [];
    const startTime = Date.now();

    devLog.info(`🔗 [Blockchain] Fetching NFTs for ${walletAddress} from ${knownContracts.length} contracts`);

    // Process contracts in parallel (up to 3 at once to avoid rate limits)
    const CONCURRENT_CONTRACTS = 3;
    for (let i = 0; i < knownContracts.length; i += CONCURRENT_CONTRACTS) {
        const batch = knownContracts.slice(i, i + CONCURRENT_CONTRACTS);

        const batchResults = await Promise.allSettled(
            batch.map(contractAddress => processContract(client, contractAddress, walletAddress))
        );

        batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                nfts.push(...result.value);
            } else {
                devLog.error(`  ❌ Contract ${batch[index]} failed:`, result.reason);
            }
        });
    }

    const totalTime = Date.now() - startTime;
    devLog.info(`✅ [Blockchain] Found ${nfts.length} total NFTs in ${totalTime}ms`);
    return nfts;
}

/**
 * Process a single contract to find NFTs owned by wallet
 */
async function processContract(
    client: ReturnType<typeof createClient>,
    contractAddress: Address,
    walletAddress: Address
): Promise<BlockchainNFT[]> {
    const nfts: BlockchainNFT[] = [];

    // Step 1: Get balance (fast check if wallet owns any NFTs)
    const balance = await client.readContract({
        address: contractAddress,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
    });

    if (balance === BigInt(0)) {
        devLog.info(`  ↳ ${contractAddress}: 0 NFTs`);
        return nfts;
    }

    devLog.info(`  ↳ ${contractAddress}: ${balance} NFTs`);

    // Step 2: Get contract info in parallel
    const [contractName, contractSymbol] = await Promise.all([
        client.readContract({
            address: contractAddress,
            abi: ERC721_ABI,
            functionName: 'name',
        }).catch(() => 'Unknown'),
        client.readContract({
            address: contractAddress,
            abi: ERC721_ABI,
            functionName: 'symbol',
        }).catch(() => 'UNKNOWN'),
    ]);

    // Step 3: Get token IDs (try enumerable first, fallback to events)
    let tokenIds: bigint[] = [];
    try {
        // Attempt ERC721Enumerable (parallel queries)
        const enumerablePromises = [];
        for (let i = 0; i < Number(balance); i++) {
            enumerablePromises.push(
                client.readContract({
                    address: contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'tokenOfOwnerByIndex',
                    args: [walletAddress, BigInt(i)],
                })
            );
        }
        tokenIds = await Promise.all(enumerablePromises);
        devLog.info(`    ✅ Used ERC721Enumerable for ${contractAddress}`);
    } catch (error) {
        // Fallback: Query Transfer events
        devLog.warn(`    ⚠️ Not enumerable, using Transfer events for ${contractAddress}`);
        tokenIds = await getTokenIdsFromEvents(client, contractAddress, walletAddress, balance);
    }

    // Step 4: Fetch metadata in optimized batches
    const BATCH_SIZE = 5; // Process 5 NFTs at once
    for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
        const batch = tokenIds.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(tokenId => fetchTokenData(client, contractAddress, tokenId, contractName as string, contractSymbol as string))
        );

        batchResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                nfts.push(result.value);
            }
        });
    }

    return nfts;
}

/**
 * Fetch data for a single token (URI + metadata)
 */
async function fetchTokenData(
    client: ReturnType<typeof createClient>,
    contractAddress: Address,
    tokenId: bigint,
    contractName: string,
    contractSymbol: string
): Promise<BlockchainNFT | null> {
    try {
        // Get tokenURI
        const tokenURI = await client.readContract({
            address: contractAddress,
            abi: ERC721_ABI,
            functionName: 'tokenURI',
            args: [tokenId],
        }).catch(() => '');

        // Fetch metadata from IPFS/HTTP if available
        let metadata: NFTMetadata | null = null;
        if (tokenURI) {
            metadata = await fetchMetadata(tokenURI);
        }

        return {
            contractAddress: contractAddress.toLowerCase(),
            tokenId: tokenId.toString(),
            tokenURI: tokenURI || undefined,
            name: metadata?.name,
            description: metadata?.description,
            image: metadata?.image,
            contractName,
            contractSymbol,
        };
    } catch (error) {
        devLog.warn(`    ⚠️ Failed to fetch token ${tokenId}:`, error);
        // Return basic NFT info even if metadata fails
        return {
            contractAddress: contractAddress.toLowerCase(),
            tokenId: tokenId.toString(),
            contractName,
            contractSymbol,
        };
    }
}

/**
 * Get token IDs from Transfer events (fallback for non-enumerable contracts)
 */
async function getTokenIdsFromEvents(
    client: ReturnType<typeof createClient>,
    contractAddress: Address,
    walletAddress: Address,
    expectedBalance: bigint
): Promise<bigint[]> {
    try {
        const latestBlock = await client.getBlockNumber();

        // Query Transfer events in balanced chunks to reduce RPC call count
        const logs: Awaited<ReturnType<typeof client.getLogs>> = [];
        let toBlock = latestBlock;
        let requestCount = BigInt(0);

        while (requestCount < MAX_EVENT_LOG_REQUESTS) {
            const fromBlock = toBlock > EVENT_LOG_BLOCK_RANGE
                ? toBlock - EVENT_LOG_BLOCK_RANGE
                : BigInt(0);

            const chunkLogs = await client.getLogs({
                address: contractAddress,
                event: {
                    type: 'event',
                    name: 'Transfer',
                    inputs: [
                        { name: 'from', type: 'address', indexed: true },
                        { name: 'to', type: 'address', indexed: true },
                        { name: 'tokenId', type: 'uint256', indexed: true }
                    ],
                },
                args: {
                    to: walletAddress,
                },
                fromBlock,
                toBlock,
            });

            incrementRequestCounter('rpc.getLogs.transfer_query');

            logs.push(...chunkLogs);
            requestCount += BigInt(1);

            if (fromBlock === BigInt(0)) {
                break;
            }

            // Stop early if we likely collected enough candidates for current ownership
            if (expectedBalance > BigInt(0) && BigInt(logs.length) >= expectedBalance * BigInt(3)) {
                break;
            }

            toBlock = fromBlock - BigInt(1);
        }

        if (requestCount >= MAX_EVENT_LOG_REQUESTS) {
            devLog.warn(`    ⚠️ Reached max event log requests (${MAX_EVENT_LOG_REQUESTS.toString()}) for ${contractAddress}`);
        }

        // Extract token IDs and verify ownership
        const tokenIds = new Set<bigint>();
        for (const log of logs) {
            try {
                const decoded = decodeEventLog({
                    abi: ERC721_ABI,
                    data: log.data,
                    topics: log.topics,
                });

                if (decoded.eventName !== 'Transfer') continue;

                const args = decoded.args as { tokenId?: bigint };
                if (args.tokenId !== undefined) {
                    tokenIds.add(args.tokenId);
                }
            } catch {
                // Ignore non-decodable logs
            }
        }

        // Verify ownership (batch verification)
        const ownedTokenIds: bigint[] = [];
        const verifyPromises = Array.from(tokenIds).map(async (tokenId) => {
            try {
                const owner = await client.readContract({
                    address: contractAddress,
                    abi: ERC721_ABI,
                    functionName: 'ownerOf',
                    args: [tokenId],
                });
                incrementRequestCounter('rpc.readContract.ownerOf_verification');
                if (owner.toLowerCase() === walletAddress.toLowerCase()) {
                    return tokenId;
                }
            } catch {
                // Token might be burned or transferred
            }
            return null;
        });

        const results = await Promise.all(verifyPromises);
        results.forEach((tokenId) => {
            if (tokenId !== null) {
                ownedTokenIds.push(tokenId);
            }
        });

        return ownedTokenIds;
    } catch (error) {
        devLog.error('Error querying Transfer events:', error);
        return [];
    }
}

/**
 * Get known NFT contract addresses from marketplace
 * Queries MongoDB directly for better performance
 */
export async function getKnownContractAddresses(): Promise<Address[]> {
    try {
        const collection = await getEnrichedNFTsCollection();

        // Get distinct contract addresses from listed NFTs
        const addresses = await collection.distinct('nftAddress', {
            'marketplace.isListed': true
        });

        const uniqueAddresses = addresses
            .filter((addr): addr is string => typeof addr === 'string' && addr.length > 0)
            .map(addr => addr.toLowerCase());

        devLog.info(`  ↳ Found ${uniqueAddresses.length} unique contract addresses in marketplace`);
        return uniqueAddresses as Address[];
    } catch (error) {
        devLog.error('Error fetching known contracts:', error instanceof Error ? error.message : 'Unknown error');
        devLog.error('  Stack:', error);
        return [];
    }
}
