import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface AdminNFTInsight {
  _id?: ObjectId;
  contractAddress: string;
  tokenId: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  // Project/Product Information
  projectName?: string;
  projectDescription?: string;
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

    // TODO: Add admin authentication check here

    if (!data.contractAddress || !data.tokenId || !data.title) {
      return NextResponse.json(
        { success: false, error: 'contractAddress, tokenId, and title are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_nft_insights');

    const insight: Omit<AdminNFTInsight, '_id'> = {
      contractAddress: data.contractAddress.toLowerCase(),
      tokenId: data.tokenId,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      rarity: data.rarity,
      // Project/Product Information
      projectName: data.projectName,
      projectDescription: data.projectDescription,
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

// PUT /api/admin/insights/nft - Update admin insight for NFT
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // TODO: Add admin authentication check here

    if (!data.contractAddress || !data.tokenId) {
      return NextResponse.json(
        { success: false, error: 'contractAddress and tokenId are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_nft_insights');

    const updateData = {
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      rarity: data.rarity,
      // Project/Product Information
      projectName: data.projectName,
      projectDescription: data.projectDescription,
      projectWebsite: data.projectWebsite,
      projectTwitter: data.projectTwitter,
      projectDiscord: data.projectDiscord,
      // Partnerships
      partnerships: data.partnerships || [],
      partnershipDetails: data.partnershipDetails,
      updatedAt: new Date().toISOString(),
    };

    const result = await collection.updateOne(
      {
        contractAddress: data.contractAddress.toLowerCase(),
        tokenId: data.tokenId
      },
      { $set: updateData },
      { upsert: true }
    );

    const updated = await collection.findOne({
      contractAddress: data.contractAddress.toLowerCase(),
      tokenId: data.tokenId
    });

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

// DELETE /api/admin/insights/nft - Delete admin insight for NFT
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const tokenId = searchParams.get('tokenId');

    // TODO: Add admin authentication check here

    if (!contractAddress || !tokenId) {
      return NextResponse.json(
        { success: false, error: 'contractAddress and tokenId are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_nft_insights');

    const result = await collection.deleteOne({
      contractAddress: contractAddress.toLowerCase(),
      tokenId: tokenId
    });

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