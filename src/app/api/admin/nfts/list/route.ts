import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiSuccess, apiInternalError, rateLimit, RATE_LIMIT_CONFIG } from '@/lib/api';

// GET /api/admin/nfts/list - Liste aller NFTs aus nft_metadata Collection
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        await rateLimit(request, RATE_LIMIT_CONFIG.STRICT);

        // Get nft_metadata collection
        const collection = await getCollection('nft_metadata');

        // Fetch all NFTs mit relevanten Feldern (nur mit gültiger tokenId)
        const nfts = await collection
            .find({ tokenId: { $ne: null } })
            .project({
                contractAddress: 1,
                tokenId: 1,
                'metadata.name': 1,
                'metadata.image': 1,
                'insights.customTitle': 1
            })
            .sort({ contractAddress: 1, tokenId: 1 })
            .limit(1000) // Max 1000 NFTs für Performance
            .toArray();

        // Transform to simple format
        const formattedNFTs = nfts.map(nft => ({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            name: nft.insights?.customTitle || nft.metadata?.name || `NFT #${nft.tokenId}`,
            image: nft.metadata?.image || null
        }));

        return apiSuccess({
            nfts: formattedNFTs,
            count: formattedNFTs.length
        });
    } catch (error) {
        console.error('Error fetching NFT list:', error);
        return apiInternalError('Failed to fetch NFT list');
    }
}
