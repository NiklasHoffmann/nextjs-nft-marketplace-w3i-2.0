/**
 * Admin Collection Insights API Route (REFACTORED - WITH AUTH)
 * 
 * Uses new standardized API infrastructure:
 * - apiHandler wrapper for error handling
 * - withAdmin middleware for authentication ✅
 * - Zod validation
 * - Type-safe responses
 * 
 * Routes:
 * - POST /api/nft/admin/insights/collections - Create insight (ADMIN ONLY)
 * - PUT /api/nft/admin/insights/collections - Update insight (ADMIN ONLY)
 * - DELETE /api/nft/admin/insights/collections - Delete insight (ADMIN ONLY)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { apiHandler } from '@/lib/api/handler';
import { withAdmin } from '@/lib/middleware/auth';
import { apiBadRequest, apiNotFound, apiSuccess } from '@/lib/api/responses';
import { ConflictError } from '@/lib/api/errors';
import type { NFTProjectDescriptions } from '@/types/features/nft-insights';

// ===== TYPES =====

interface AdminCollectionInsight {
  _id?: ObjectId;
  contractAddress: string;
  customTitle?: string;
  title: string;
  description?: string;
  descriptions?: string[];
  specificDescriptions?: NFTProjectDescriptions;
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  projectName?: string;
  projectDescription?: string;
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

const createCollectionInsightSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  customTitle: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  descriptions: z.array(z.string()).optional(),
  specificDescriptions: z.any().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).optional(),
  projectName: z.string().optional(),
  projectDescription: z.string().optional(),
  projectWebsite: z.string().url().optional().or(z.literal('')),
  projectTwitter: z.string().optional(),
  projectDiscord: z.string().optional(),
  partnerships: z.array(z.string()).optional(),
  partnershipDetails: z.string().optional(),
});

const updateCollectionInsightSchema = createCollectionInsightSchema;

const deleteCollectionInsightSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// ===== ROUTE HANDLERS =====

/**
 * POST /api/nft/admin/insights/collections
 * Create collection insight (ADMIN ONLY - Auto-authenticated)
 */
export const POST = apiHandler(async (req: NextRequest) => {
  // Apply admin middleware for authentication
  await withAdmin(req);
  
  // Get authenticated admin address
  // @ts-ignore - added by withAdmin middleware
  const adminAddress = req.userAddress as string;
  
  // Parse and validate request body
  const body = await req.json();
  const parseResult = createCollectionInsightSchema.safeParse(body);
  
  if (!parseResult.success) {
    return apiBadRequest('Invalid request data', parseResult.error.format());
  }
  
  const data = parseResult.data;
  const collection = await getCollection('admin_collection_insights');

  // Check if insights already exist
  const existing = await collection.findOne({
    contractAddress: data.contractAddress.toLowerCase()
  });

  if (existing) {
    throw new ConflictError('Collection insights already exist');
  }

  const insight: Omit<AdminCollectionInsight, '_id'> = {
    contractAddress: data.contractAddress.toLowerCase(),
    customTitle: data.customTitle || '',
    title: data.title || data.customTitle || '',
    description: data.description,
    descriptions: data.descriptions || [],
    specificDescriptions: data.specificDescriptions,
    category: data.category,
    tags: data.tags || [],
    rarity: data.rarity,
    projectName: data.projectName,
    projectDescription: data.projectDescription,
    projectWebsite: data.projectWebsite,
    projectTwitter: data.projectTwitter,
    projectDiscord: data.projectDiscord,
    partnerships: data.partnerships || [],
    partnershipDetails: data.partnershipDetails,
    createdBy: adminAddress, // ✅ Uses authenticated admin address
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await collection.insertOne(insight);
  const created = await collection.findOne({ _id: result.insertedId });

  return apiSuccess(created);
});

/**
 * PUT /api/nft/admin/insights/collections
 * Update collection insight (ADMIN ONLY - Auto-authenticated)
 */
export const PUT = apiHandler(async (req: NextRequest) => {
  // Apply admin middleware for authentication
  await withAdmin(req);
  
  // Parse and validate request body
  const body = await req.json();
  const parseResult = updateCollectionInsightSchema.safeParse(body);
  
  if (!parseResult.success) {
    return apiBadRequest('Invalid request data', parseResult.error.format());
  }
  
  const data = parseResult.data;
  const collection = await getCollection('admin_collection_insights');

  const updateData = {
    customTitle: data.customTitle || data.title,
    title: data.title || data.customTitle,
    description: data.description,
    descriptions: data.descriptions || [],
    specificDescriptions: data.specificDescriptions,
    category: data.category,
    tags: data.tags || [],
    rarity: data.rarity,
    projectName: data.projectName,
    projectDescription: data.projectDescription,
    projectWebsite: data.projectWebsite,
    projectTwitter: data.projectTwitter,
    projectDiscord: data.projectDiscord,
    partnerships: data.partnerships || [],
    partnershipDetails: data.partnershipDetails,
    updatedAt: new Date().toISOString(),
  };

  const result = await collection.updateOne(
    { contractAddress: data.contractAddress.toLowerCase() },
    { $set: updateData },
    { upsert: true }
  );

  const updated = await collection.findOne({
    contractAddress: data.contractAddress.toLowerCase()
  });

  return apiSuccess(updated);
});

/**
 * DELETE /api/nft/admin/insights/collections
 * Delete collection insight (ADMIN ONLY - Auto-authenticated)
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
  // Apply admin middleware for authentication
  await withAdmin(req);
  
  // Parse query parameters
  const { searchParams } = new URL(req.url);
  const contractAddress = searchParams.get('contractAddress');

  if (!contractAddress) {
    return apiBadRequest('contractAddress parameter is required');
  }

  // Validate
  const parseResult = deleteCollectionInsightSchema.safeParse({ contractAddress });
  if (!parseResult.success) {
    return apiBadRequest('Invalid parameters', parseResult.error.format());
  }

  const collection = await getCollection('admin_collection_insights');

  const result = await collection.deleteOne({
    contractAddress: contractAddress.toLowerCase()
  });

  if (result.deletedCount === 0) {
    return apiNotFound('Collection insights not found');
  }

  return apiSuccess({ deleted: true });
});
