/**
 * Admin NFT Insights API Route (REFACTORED - WITH AUTH)
 * 
 * Uses new standardized API infrastructure:
 * - apiHandler wrapper for error handling
 * - admin option for authentication ✅
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
import { apiHandler } from '@/lib/api';
import { apiBadRequest, apiNotFound, apiSuccess } from '@/lib/api';
import type {
  NFTProjectDescriptions,
  NFTFunctionalitiesDescriptions,
  TitleDescriptionPair
} from '@/types/features/nft-insights';

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

type RawTitleDescriptionPair = Omit<TitleDescriptionPair, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type RawProjectDescriptions = Omit<NFTProjectDescriptions, 'titleDescriptionPairs'> & {
  titleDescriptionPairs: RawTitleDescriptionPair[];
};

type RawFunctionalitiesDescriptions = Omit<NFTFunctionalitiesDescriptions, 'titleDescriptionPairs'> & {
  titleDescriptionPairs: RawTitleDescriptionPair[];
};

function normalizeDescriptions(value?: RawProjectDescriptions): NFTProjectDescriptions | undefined;
function normalizeDescriptions(value?: RawFunctionalitiesDescriptions): NFTFunctionalitiesDescriptions | undefined;
function normalizeDescriptions(
  value?: RawProjectDescriptions | RawFunctionalitiesDescriptions
): NFTProjectDescriptions | NFTFunctionalitiesDescriptions | undefined {
  if (!value) return value;

  return {
    ...value,
    titleDescriptionPairs: value.titleDescriptionPairs.map((pair) => ({
      ...pair,
      createdAt: typeof pair.createdAt === 'string' ? new Date(pair.createdAt) : pair.createdAt,
      updatedAt: typeof pair.updatedAt === 'string' ? new Date(pair.updatedAt) : pair.updatedAt
    }))
  };
}

const sanitizeCardDescriptions = (value?: string[]): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((desc) => (typeof desc === 'string' ? desc.trim() : ''))
    .filter((desc) => desc.length > 0)
    .slice(0, 2);
};

// ===== VALIDATION SCHEMAS =====

const titleDescriptionPairSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional().default(''),
  descriptions: z.array(z.string()).optional().default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const projectDescriptionsSchema = z.object({
  titleDescriptionPairs: z.array(titleDescriptionPairSchema).default([]),
  legacyDescriptions: z.array(z.string()).optional(),
});

const functionalitiesDescriptionsSchema = z.object({
  titleDescriptionPairs: z.array(titleDescriptionPairSchema).optional().default([]),
});

const createInsightSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  tokenId: z.string().regex(/^\d*$/, 'Token ID must be a number or empty').optional().default(''),
  customTitle: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  descriptions: z.array(z.string()).optional(),
  projectDescriptions: projectDescriptionsSchema.optional(),
  functionalitiesDescriptions: functionalitiesDescriptionsSchema.optional(),
  specificDescriptions: projectDescriptionsSchema.optional(),
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
  // Get authenticated admin address
  const adminAddress = req.userAddress as string;

  // Parse and validate request body
  const body = await req.json();
  const parseResult = createInsightSchema.safeParse(body);

  if (!parseResult.success) {
    return apiBadRequest('Invalid request data', parseResult.error.format());
  }

  const data = parseResult.data;
  const collection = await getCollection('admin_nft_insights');
  const projectDescriptions = normalizeDescriptions(data.projectDescriptions);
  const functionalitiesDescriptions = normalizeDescriptions(data.functionalitiesDescriptions);
  const specificDescriptions = normalizeDescriptions(data.specificDescriptions || data.projectDescriptions);

  const insight: Omit<AdminNFTInsight, '_id'> = {
    contractAddress: data.contractAddress.toLowerCase(),
    tokenId: data.tokenId || '',
    customTitle: data.customTitle || data.title || '',
    title: data.title || data.customTitle || '',
    description: data.description || (data.descriptions && data.descriptions.length > 0 ? data.descriptions[0] : undefined),
    descriptions: (data.descriptions && data.descriptions.length > 0)
      ? data.descriptions
      : (data.description ? [data.description] : []),
    projectDescriptions,
    functionalitiesDescriptions,
    specificDescriptions,
    cardDescriptions: sanitizeCardDescriptions(data.cardDescriptions),
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
}, { admin: true });

/**
 * PUT /api/nft/admin/insights
 * Update existing NFT insight (ADMIN ONLY - Auto-authenticated)
 */
export const PUT = apiHandler(async (req: NextRequest) => {
  // Parse and validate request body
  const body = await req.json();
  const parseResult = updateInsightSchema.safeParse(body);

  if (!parseResult.success) {
    return apiBadRequest('Invalid request data', parseResult.error.format());
  }

  const data = parseResult.data;
  const collection = await getCollection('admin_nft_insights');
  const {
    _id,
    projectDescriptions: rawProjectDescriptions,
    functionalitiesDescriptions: rawFunctionalitiesDescriptions,
    specificDescriptions: rawSpecificDescriptions,
    ...updateData
  } = data;

  const projectDescriptions = normalizeDescriptions(rawProjectDescriptions);
  const functionalitiesDescriptions = normalizeDescriptions(rawFunctionalitiesDescriptions);
  const specificDescriptions = normalizeDescriptions(rawSpecificDescriptions || rawProjectDescriptions);

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

  if (projectDescriptions !== undefined) {
    update.projectDescriptions = projectDescriptions;
  }
  if (functionalitiesDescriptions !== undefined) {
    update.functionalitiesDescriptions = functionalitiesDescriptions;
  }
  if (specificDescriptions !== undefined) {
    update.specificDescriptions = specificDescriptions;
  }

  // Handle legacy field synchronization
  if (update.customTitle) {
    update.title = update.customTitle;
  } else if (update.title) {
    update.customTitle = update.title;
  }
  if (update.projectDescriptions) {
    update.specificDescriptions = update.projectDescriptions;
  }

  if (update.description && (!update.descriptions || update.descriptions.length === 0)) {
    update.descriptions = [update.description];
  }

  if (update.descriptions && update.descriptions.length > 0 && !update.description) {
    update.description = update.descriptions[0];
  }

  if (Array.isArray(update.cardDescriptions)) {
    update.cardDescriptions = sanitizeCardDescriptions(update.cardDescriptions);
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
}, { admin: true });

/**
 * DELETE /api/nft/admin/insights
 * Delete NFT insight (ADMIN ONLY - Auto-authenticated)
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
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
}, { admin: true });
