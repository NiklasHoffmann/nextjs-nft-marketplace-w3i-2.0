/**
 * NFT Metadata Database API
 * 
 * GET: Retrieve cached NFT metadata from nft_metadata collection
 * POST: Upsert NFT metadata (for sync operations)
 * 
 * This is separate from /api/nft/metadata which fetches from blockchain.
 * This endpoint reads/writes the cached metadata in MongoDB.
 */

import { NextRequest } from 'next/server';
import {
    apiSuccess,
    apiBadRequest,
    apiInternalError,
    rateLimit,
    RATE_LIMIT_CONFIG,
    getQueryParam,
    parseJsonBody,
    isValidAddress,
    isValidTokenId,
    BadRequestError
} from '@/lib/api';
import {
    getNFTMetadata,
    upsertNFTMetadata,
    getEnrichedNFTMetadata,
    updateNFTOwnership
} from '@/lib/db/nft-metadata';
import type { NFTMetadata } from '@/types/nft-metadata';

/**
 * GET /api/nft/metadata/cached
 * 
 * Retrieve cached NFT metadata from database
 * Query params: contractAddress, tokenId, enriched (optional)
 */
export async function GET(request: NextRequest) {
    try {
        await rateLimit(request, RATE_LIMIT_CONFIG.LENIENT);

        const contractAddress = getQueryParam(request, 'contractAddress', true);
        const tokenId = getQueryParam(request, 'tokenId', true);
        const enriched = getQueryParam(request, 'enriched', false) === 'true';

        if (!isValidAddress(contractAddress)) {
            throw new BadRequestError('Invalid NFT address format');
        }
        if (!isValidTokenId(tokenId)) {
            throw new BadRequestError('Invalid token ID format');
        }

        // Get enriched metadata with listings and stats if requested
        if (enriched) {
            const metadata = await getEnrichedNFTMetadata(contractAddress, tokenId);

            if (!metadata) {
                return apiSuccess({ exists: false });
            }

            return apiSuccess(metadata);
        }

        // Get basic metadata
        const metadata = await getNFTMetadata(contractAddress, tokenId);

        if (!metadata) {
            return apiSuccess({ exists: false });
        }

        return apiSuccess(metadata);

    } catch (error) {
        console.error('Error fetching NFT metadata:', error);

        if (error instanceof BadRequestError) {
            return apiBadRequest(error.message);
        }

        return apiInternalError('Failed to fetch NFT metadata');
    }
}

/**
 * POST /api/nft/metadata/cached
 * 
 * Upsert NFT metadata (used by sync operations)
 * Body: Partial<NFTMetadata>
 */
export async function POST(request: NextRequest) {
    try {
        await rateLimit(request, RATE_LIMIT_CONFIG.STANDARD);

        const body = await parseJsonBody<{
            contractAddress: string;
            tokenId: string;
            metadata?: NFTMetadata['metadata'];
            contract?: NFTMetadata['contract'];
            currentOwner?: string | null;
            source?: 'mint' | 'transfer' | 'purchase' | 'unknown';
        }>(request);

        const { contractAddress, tokenId, metadata, contract, currentOwner, source } = body;

        if (!contractAddress || !tokenId) {
            throw new BadRequestError('contractAddress and tokenId are required');
        }

        if (!isValidAddress(contractAddress)) {
            throw new BadRequestError('Invalid NFT address format');
        }
        if (!isValidTokenId(tokenId)) {
            throw new BadRequestError('Invalid token ID format');
        }

        const now = new Date().toISOString();

        // Build update object
        const updates: Partial<NFTMetadata> = {
            lastVerified: now
        };

        if (metadata) {
            updates.metadata = metadata;
            updates.lastMetadataUpdate = now;
        }

        if (contract) {
            updates.contract = contract;
        }

        if (currentOwner !== undefined) {
            updates.currentOwner = currentOwner ? currentOwner.toLowerCase() : null;
        }

        // Upsert metadata
        const result = await upsertNFTMetadata(contractAddress, tokenId, updates);

        // Handle ownership change if provided
        if (currentOwner && source) {
            await updateNFTOwnership(contractAddress, tokenId, currentOwner, source);
        }

        return apiSuccess(result);

    } catch (error) {
        console.error('Error upserting NFT metadata:', error);

        if (error instanceof BadRequestError) {
            return apiBadRequest(error.message);
        }

        return apiInternalError('Failed to upsert NFT metadata');
    }
}
