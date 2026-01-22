/**
 * Admin NFT Insights API Route (REFACTORED - WITH AUTH)
 * 
 * Uses new standardized API infrastructure:
 * - apiHandler wrapper for error handling
 * - withAdmin middleware for authentication ✅
 * - Custom error classes
 * - Type-safe responses
 * 
 * Routes:
 * - POST /api/nft/admin/insights - Create insight (ADMIN ONLY)
 * - PUT /api/nft/admin/insights - Update insight (ADMIN ONLY)
 * - DELETE /api/nft/admin/insights - Delete insight (ADMIN ONLY)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { apiHandler } from '@/lib/api/handler';
import { withAdmin } from '@/lib/middleware';
import { apiBadRequest, apiNotFound, apiSuccess } from '@/lib/api/responses';
import type { NFTProjectDescriptions, NFTFunctionalitiesDescriptions } from '@/types/features/nft-insights';

// ===== TYPES =====

interface AdminNFTInsight {
  _id?: ObjectId;
  contractAddress: string;
  tokenId: string;
  customTitle?: string;
  title: string;
  description?: string;
  descriptions?: string[];
  projectDescriptions?: NFTProjectDescriptions;
  functionalitiesDescriptions?: NFTFunctionalitiesDescriptions;
  specificDescriptions?: NFTProjectDescriptions;
  cardDescriptions?: string[];
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  projectWebsite?: string;
  projectTwitter?: string;
  projectDiscord?: string;
  partnerships?: string[];
  partnershipDetails?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ===== VALIDATION SCHEMAS =====

const createInsightSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  tokenId: z.string().regex(/^\d*$/, 'Token ID must be a number or empty').optional().default(''),
  customTitle: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  descriptions: z.array(z.string()).optional(),
  projectDescriptions: z.any().optional(), // TODO: Add proper schema
  functionalitiesDescriptions: z.any().optional(),
  specificDescriptions: z.any().optional(),
  cardDescriptions: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).optional(),
  projectWebsite: z.string().url().optional().or(z.literal('')),
  projectTwitter: z.string().optional(),
  projectDiscord: z.string().optional(),
  partnerships: z.array(z.string()).optional(),
  partnershipDetails: z.string().optional(),
});

const updateInsightSchema = z.object({
  _id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
}).merge(createInsightSchema.partial());

const deleteInsightSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenId: z.string().regex(/^\d*$/),
});

// ===== ROUTE HANDLERS =====

/**
 * POST /api/nft/admin/insights
 * Create new NFT insight (ADMIN ONLY - Auto-authenticated)
 */
export const POST = apiHandler(async (req: NextRequest) => {
  // Apply admin middleware for authentication
  await withAdmin(req);

  // Get authenticated admin address
  // @ts-ignore - added by withAdmin middleware
  const adminAddress = req.userAddress as string;

  // Parse and validate request body
  const body = await req.json();
  const parseResult = createInsightSchema.safeParse(body);

  if (!parseResult.success) {
    return apiBadRequest('Invalid request data', parseResult.error.format());
  }

  const data = parseResult.data;
  const collection = await getCollection('admin_nft_insights');

  const insight: Omit<AdminNFTInsight, '_id'> = {
    contractAddress: data.contractAddress.toLowerCase(),
    tokenId: data.tokenId || '',
    customTitle: data.customTitle || '',
    title: data.title || data.customTitle || '',
    description: data.description,
    descriptions: data.descriptions || [],
    projectDescriptions: data.projectDescriptions,
    functionalitiesDescriptions: data.functionalitiesDescriptions,
    specificDescriptions: data.specificDescriptions || data.projectDescriptions,
    cardDescriptions: data.cardDescriptions || [],
    category: data.category,
    tags: data.tags || [],
    rarity: data.rarity,
    projectWebsite: data.projectWebsite,
    projectTwitter: data.projectTwitter,
    projectDiscord: data.projectDiscord,
    partnerships: data.partnerships || [],
    partnershipDetails: data.partnershipDetails,
    createdBy: adminAddress, // ✅ Uses authenticated admin address
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Check for existing insight
  const existing = await collection.findOne({
    contractAddress: insight.contractAddress,
    tokenId: insight.tokenId,
  });

  if (existing) {
    return apiBadRequest('Insight already exists for this NFT');
  }

  const result = await collection.insertOne(insight);

  return apiSuccess({
    _id: result.insertedId.toString(),
    ...insight,
  });
});

/**
 * PUT /api/nft/admin/insights
 * Update existing NFT insight (ADMIN ONLY - Auto-authenticated)
 */
export const PUT = apiHandler(async (req: NextRequest) => {
  // Apply admin middleware for authentication
  await withAdmin(req);

  // Parse and validate request body
  const body = await req.json();
  const parseResult = updateInsightSchema.safeParse(body);

  if (!parseResult.success) {
    return apiBadRequest('Invalid request data', parseResult.error.format());
  }

  const data = parseResult.data;
  const collection = await getCollection('admin_nft_insights');

  const { _id, ...updateData } = data;

  // Find existing insight
  const existing = await collection.findOne({ _id: new ObjectId(_id) });
  if (!existing) {
    return apiNotFound('Insight not found');
  }

  // Prepare update
  const update: Partial<AdminNFTInsight> = {
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  // Handle legacy field synchronization
  if (update.customTitle) {
    update.title = update.customTitle;
  }
  if (update.projectDescriptions) {
    update.specificDescriptions = update.projectDescriptions;
  }

  // Lowercase contract address if present
  if (update.contractAddress) {
    update.contractAddress = update.contractAddress.toLowerCase();
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(_id) },
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!result) {
    return apiNotFound('Insight not found');
  }

  return apiSuccess(result);
});

/**
 * DELETE /api/nft/admin/insights
 * Delete NFT insight (ADMIN ONLY - Auto-authenticated)
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
  // Apply admin middleware for authentication
  await withAdmin(req);

  // Parse query parameters for DELETE
  const { searchParams } = new URL(req.url);
  const contractAddress = searchParams.get('contractAddress');
  const tokenId = searchParams.get('tokenId') || '';

  if (!contractAddress) {
    return apiBadRequest('Missing contractAddress parameter');
  }

  // Validate
  const parseResult = deleteInsightSchema.safeParse({ contractAddress, tokenId });
  if (!parseResult.success) {
    return apiBadRequest('Invalid parameters', parseResult.error.format());
  }

  const collection = await getCollection('admin_nft_insights');

  const result = await collection.deleteOne({
    contractAddress: contractAddress.toLowerCase(),
    tokenId: tokenId,
  });

  if (result.deletedCount === 0) {
    return apiNotFound('Insight not found');
  }

  return apiSuccess({ deleted: true });
});
