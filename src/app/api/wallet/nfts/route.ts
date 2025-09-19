import { NextRequest, NextResponse } from 'next/server';

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
    source?: 'alchemy' | 'moralis';
}



// Alchemy API integration (when API key is available)
async function fetchFromAlchemy(walletAddress: string): Promise<ExternalNFT[]> {
    // Use your specific Alchemy API key from .env.local
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
        throw new Error('Alchemy API key not configured. Please set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local');
    }

    // Use Sepolia network as configured in your .env.local
    const baseURL = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}`;

    console.log('🔍 Fetching NFTs from Alchemy (Sepolia) for wallet:', walletAddress);

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
        console.error('❌ Alchemy API error:', response.status, errorText);
        throw new Error(`Alchemy API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Alchemy response:', { total: data.totalCount, nfts: data.ownedNfts?.length || 0 });

    return data.ownedNfts?.map((nft: any) => ({
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        name: nft.name || nft.title || `NFT #${nft.tokenId}`,
        description: nft.description,
        image: nft.image?.originalUrl || nft.image?.cachedUrl || nft.image?.thumbnailUrl,
        animationUrl: nft.animation_url,
        attributes: nft.attributes || [],
        contractName: nft.contract.name,
        contractSymbol: nft.contract.symbol,
        tokenType: nft.contract.tokenType,
        balance: nft.balance
    })) || [];
}

// Moralis API integration (alternative)
async function fetchFromMoralis(walletAddress: string): Promise<ExternalNFT[]> {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
        throw new Error('Moralis API key not configured. Add MORALIS_API_KEY to .env.local if you want to use Moralis as fallback');
    }

    // Use Sepolia chain to match your setup
    const chain = process.env.MORALIS_CHAIN || 'sepolia';

    console.log('🔍 Fetching NFTs from Moralis (Sepolia) for wallet:', walletAddress);

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
        console.error('❌ Moralis API error:', response.status, errorText);
        throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Moralis response:', { total: data.total, nfts: data.result?.length || 0 });

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
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('address');
        const source = searchParams.get('source') || 'auto'; // 'alchemy', 'moralis', 'auto'

        // Validation
        if (!walletAddress) {
            return NextResponse.json(
                { success: false, error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return NextResponse.json(
                { success: false, error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        console.log('🔍 Fetching NFTs for wallet:', walletAddress, 'source:', source);

        let nfts: ExternalNFT[] = [];
        let usedSource: 'alchemy' | 'moralis' = 'alchemy';

        try {
            // Try different sources based on preference and availability
            if (source === 'alchemy' || source === 'auto') {
                try {
                    nfts = await fetchFromAlchemy(walletAddress);
                    usedSource = 'alchemy';
                    console.log('✅ Successfully fetched from Alchemy:', nfts.length, 'NFTs');
                } catch (alchemyError) {
                    console.log('⚠️ Alchemy failed:', alchemyError);
                    if (source === 'alchemy') throw alchemyError; // If specifically requested, throw error
                }
            }

            // Fallback to Moralis if Alchemy failed and auto mode
            if (nfts.length === 0 && (source === 'moralis' || source === 'auto')) {
                try {
                    nfts = await fetchFromMoralis(walletAddress);
                    usedSource = 'moralis';
                    console.log('✅ Successfully fetched from Moralis:', nfts.length, 'NFTs');
                } catch (moralisError) {
                    console.log('⚠️ Moralis failed:', moralisError);
                    if (source === 'moralis') throw moralisError; // If specifically requested, throw error
                }
            }

            // If no NFTs found, that's okay - wallet might be empty
            if (nfts.length === 0) {
                console.log('ℹ️ No NFTs found in wallet:', walletAddress);
            }

        } catch (apiError) {
            console.error('❌ API request failed:', apiError);
            throw apiError;
        }

        const response: WalletNFTsResponse = {
            success: true,
            data: nfts,
            total: nfts.length,
            source: usedSource
        };

        console.log('✅ Returning', nfts.length, 'NFTs from', usedSource);
        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ Error fetching wallet NFTs:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch wallet NFTs'
            },
            { status: 500 }
        );
    }
}

export { type ExternalNFT, type WalletNFTsResponse };