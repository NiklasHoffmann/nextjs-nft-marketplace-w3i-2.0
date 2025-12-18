import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { getCollection } from '@/lib/mongodb';

// GET /api/admin/nfts/list - Liste aller NFTs aus nft_metadata Collection
export const GET = apiHandler(async (request: NextRequest) => {
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
        .limit(1000)
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
}, { admin: true });
