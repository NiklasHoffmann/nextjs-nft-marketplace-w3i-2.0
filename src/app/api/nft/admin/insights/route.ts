import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NFTProjectDescriptions, NFTFunctionalitiesDescriptions } from '@/types/05-features/03-nft-insights';

interface AdminNFTInsight {
  _id?: ObjectId;
  contractAddress: string;
  tokenId: string;
  customTitle?: string; // New consistent field name
  title: string; // Legacy support
  description?: string;
  descriptions?: string[]; // Legacy array of descriptions
  projectDescriptions?: NFTProjectDescriptions; // Enhanced project-specific descriptions
  functionalitiesDescriptions?: NFTFunctionalitiesDescriptions; // Enhanced functionalities descriptions
  specificDescriptions?: NFTProjectDescriptions; // Legacy support - maps to projectDescriptions
  cardDescriptions?: string[]; // NFT Card descriptions (max 3, with character limit)
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  // Social/Partnership Information
  projectWebsite?: string;
  projectTwitter?: string;
  projectDiscord?: string;
  // Partnerships
  partnerships?: string[];
  partnershipDetails?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Admin routes for Create, Update, Delete only
// For reading insights, use /api/nft/insights

// POST /api/nft/admin/insights - Create admin insight for NFT
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('🔍 POST /api/nft/admin/insights - Received data:', JSON.stringify(data, null, 2));
    console.log('🎯 Token ID Debug - API side:', {
      'Received tokenId': data.tokenId,
      'Type': typeof data.tokenId,
      'Length': data.tokenId?.length,
      'Is empty string': data.tokenId === '',
      'Is undefined': data.tokenId === undefined,
      'Is null': data.tokenId === null,
      'Will be collection-wide': (data.tokenId || '') === ''
    });

    // TODO: Add admin authentication check here

    // Validation - only contractAddress is required
    if (!data.contractAddress) {
      return NextResponse.json(
        { success: false, error: 'contractAddress is required' },
        { status: 400 }
      );
    }

    // Token ID validation - only validate format if provided
    if (data.tokenId && !/^\d+$/.test(data.tokenId.toString())) {
      return NextResponse.json(
        { success: false, error: 'tokenId must be a valid number if provided' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_nft_insights');

    const insight: Omit<AdminNFTInsight, '_id'> = {
      contractAddress: data.contractAddress.toLowerCase(),
      tokenId: data.tokenId || '', // Allow empty for collection-wide insights
      customTitle: data.customTitle || '', // Allow empty custom title
      title: data.title || data.customTitle || '', // Legacy support
      description: data.description,
      descriptions: data.descriptions || [], // Legacy descriptions array
      projectDescriptions: data.projectDescriptions, // Enhanced project descriptions
      functionalitiesDescriptions: data.functionalitiesDescriptions, // Enhanced functionalities descriptions
      specificDescriptions: data.specificDescriptions || data.projectDescriptions, // Legacy support
      cardDescriptions: data.cardDescriptions || [], // NFT Card descriptions
      category: data.category,
      tags: data.tags || [],
      rarity: data.rarity,
      // Social/Partnership Information
      projectWebsite: data.projectWebsite,
      projectTwitter: data.projectTwitter,
      projectDiscord: data.projectDiscord,
      // Partnerships
      partnerships: data.partnerships || [],
      partnershipDetails: data.partnershipDetails,
      createdBy: data.createdBy || 'admin', // TODO: Get from auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(insight);
    const created = await collection.findOne({ _id: result.insertedId });

    console.log('✅ Created insight in database:', JSON.stringify(created, null, 2));

    return NextResponse.json({
      success: true,
      data: created
    });

  } catch (error) {
    console.error('Error creating admin NFT insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create insight' },
      { status: 500 }
    );
  }
}

// PUT /api/nft/admin/insights - Update admin insight for NFT
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('🔍 PUT /api/nft/admin/insights - Received data:', JSON.stringify(data, null, 2));

    // TODO: Add admin authentication check here

    // Validation - only contractAddress is required for updates
    if (!data.contractAddress) {
      return NextResponse.json(
        { success: false, error: 'contractAddress is required' },
        { status: 400 }
      );
    }

    // Token ID validation - only validate format if provided
    if (data.tokenId && !/^\d+$/.test(data.tokenId.toString())) {
      return NextResponse.json(
        { success: false, error: 'tokenId must be a valid number if provided' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_nft_insights');

    const updateData = {
      customTitle: data.customTitle || '', // Allow empty custom title
      title: data.title || data.customTitle || '', // Legacy support
      description: data.description,
      descriptions: data.descriptions || [], // Legacy descriptions array
      projectDescriptions: data.projectDescriptions, // Enhanced project descriptions
      functionalitiesDescriptions: data.functionalitiesDescriptions, // Enhanced functionalities descriptions
      specificDescriptions: data.specificDescriptions || data.projectDescriptions, // Legacy support
      cardDescriptions: data.cardDescriptions || [], // NFT Card descriptions
      category: data.category,
      tags: data.tags || [],
      rarity: data.rarity,
      // Social/Partnership Information
      projectWebsite: data.projectWebsite,
      projectTwitter: data.projectTwitter,
      projectDiscord: data.projectDiscord,
      // Partnerships
      partnerships: data.partnerships || [],
      partnershipDetails: data.partnershipDetails,
      updatedAt: new Date().toISOString(),
    };

    // Build query - handle both collection-wide and NFT-specific insights
    const query: any = {
      contractAddress: data.contractAddress.toLowerCase()
    };

    // Add tokenId to query if provided, otherwise look for collection-wide insights (empty tokenId)
    if (data.tokenId) {
      query.tokenId = data.tokenId;
    } else {
      query.tokenId = '';
    }

    const result = await collection.updateOne(
      query,
      { $set: updateData },
      { upsert: true }
    );

    const updated = await collection.findOne({
      contractAddress: data.contractAddress.toLowerCase(),
      tokenId: data.tokenId
    });

    console.log('✅ Updated insight in database:', JSON.stringify(updated, null, 2));

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error updating admin NFT insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}

// DELETE /api/nft/admin/insights - Delete admin insight for NFT
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const tokenId = searchParams.get('tokenId');

    // TODO: Add admin authentication check here

    // Validation - only contractAddress is required for deletion
    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'contractAddress is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_nft_insights');

    // Build query - handle both collection-wide and NFT-specific insights
    const query: any = {
      contractAddress: contractAddress.toLowerCase()
    };

    // Add tokenId to query if provided, otherwise look for collection-wide insights (empty tokenId)
    if (tokenId) {
      query.tokenId = tokenId;
    } else {
      query.tokenId = '';
    }

    const result = await collection.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Insight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Insight deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting admin NFT insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete insight' },
      { status: 500 }
    );
  }
}