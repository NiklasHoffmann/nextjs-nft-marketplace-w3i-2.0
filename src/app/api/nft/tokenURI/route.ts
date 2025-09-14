// app/api/web3/tokenURI/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';

// ERC721 ABI für tokenURI
const ERC721_ABI = [
    {
        name: 'tokenURI',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
    },
] as const;

// Konfiguration für verschiedene Chains
const getChainConfig = (chainId?: string) => {
    // Verwende die konfigurierten Alchemy URLs aus .env.local
    const sepoliaRpcUrl = process.env.ALCHEMY_URL || process.env.INFURA_URL || 'https://rpc.sepolia.org';
    const mainnetRpcUrl = process.env.ALCHEMY_URL?.replace('sepolia', 'mainnet') || 'https://eth.llamarpc.com';

    // Default zu Sepolia für Testnet mit deinen konfigurierten URLs
    if (chainId === '1') {
        return {
            chain: mainnet,
            rpcUrl: mainnetRpcUrl
        };
    }

    return {
        chain: sepolia,
        rpcUrl: sepoliaRpcUrl
    };
};

// Public client für Blockchain-Interaktion
const createClient = (chainConfig: any) => {
    return createPublicClient({
        chain: chainConfig.chain,
        transport: http(chainConfig.rpcUrl)
    });
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const nftAddress = searchParams.get('address');
    const tokenId = searchParams.get('tokenId');
    const chainId = searchParams.get('chainId'); // Optional

    if (!nftAddress || !tokenId) {
        return NextResponse.json(
            { error: 'Missing nftAddress or tokenId parameter' },
            { status: 400 }
        );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(nftAddress)) {
        return NextResponse.json(
            { error: 'Invalid NFT address format' },
            { status: 400 }
        );
    }

    try {
        // Convert tokenId to BigInt with validation
        let tokenIdBigInt: bigint;
        try {
            tokenIdBigInt = BigInt(tokenId);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid tokenId - must be a valid number' },
                { status: 400 }
            );
        }

        const chainConfig = getChainConfig(chainId || undefined);
        const publicClient = createClient(chainConfig);

        // Call tokenURI function on the contract with timeout
        const tokenURI = await Promise.race([
            publicClient.readContract({
                address: nftAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [tokenIdBigInt],
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            )
        ]);

        return NextResponse.json({
            tokenURI,
            nftAddress,
            tokenId,
            chainId: chainConfig.chain.id,
            timestamp: Date.now()
        });

    } catch (error: any) {
        console.error('Error fetching tokenURI from blockchain:', error);

        // Specific error messages
        let errorMessage = 'Failed to fetch tokenURI from blockchain';
        let statusCode = 500;

        if (error.message?.includes('timeout')) {
            errorMessage = 'Blockchain request timeout';
            statusCode = 408;
        } else if (error.message?.includes('execution reverted')) {
            errorMessage = 'Contract execution reverted - token may not exist';
            statusCode = 404;
        } else if (error.message?.includes('CALL_EXCEPTION')) {
            errorMessage = 'Contract call failed - invalid contract or method';
            statusCode = 400;
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                nftAddress,
                tokenId
            },
            { status: statusCode }
        );
    }
}
