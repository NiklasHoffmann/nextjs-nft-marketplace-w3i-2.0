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
import { apiHandler, apiSuccess, getQueryParam, parseJsonBody, isValidAddress, BadRequestError } from '@/lib/api';
import {
    getNFTMetadata,
    upsertNFTMetadata,
    getEnrichedNFTMetadata,
    updateNFTOwnership
} from '@/lib/db';
import type { NFTMetadata } from '@/types/nft-metadata';

/**
 * GET /api/nft/metadata/cached
 * 
 * Retrieve cached NFT metadata from database
 * Query params: contractAddress, tokenId, enriched (optional)
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const contractAddress = getQueryParam(request, 'contractAddress');
    const tokenId = getQueryParam(request, 'tokenId');
    const enriched = getQueryParam(request, 'enriched') === 'true';

    if (!contractAddress || !tokenId) {
        throw new BadRequestError('contractAddress and tokenId are required');
    }

    if (!isValidAddress(contractAddress)) {
        throw new BadRequestError('Invalid NFT address format');
    }

    // Get enriched metadata with listings and stats if requested
    if (enriched) {
        const metadata = await getEnrichedNFTMetadata(contractAddress, tokenId);
        return apiSuccess(metadata || { exists: false });
    }

    // Get basic metadata
    const metadata = await getNFTMetadata(contractAddress, tokenId);
    return apiSuccess(metadata || { exists: false });
});

/**
 * POST /api/nft/metadata/cached
 * 
 * Upsert NFT metadata (used by sync operations)
 * Body: Partial<NFTMetadata>
 */
export const POST = apiHandler(async (request: NextRequest) => {
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
});
