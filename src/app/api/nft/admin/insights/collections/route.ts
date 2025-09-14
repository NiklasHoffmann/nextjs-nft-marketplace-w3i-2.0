import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface AdminCollectionInsight {
  _id?: ObjectId;
  contractAddress: string;
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
// For reading insights, use /api/nft/insights/collections

// POST /api/nft/admin/insights/collections - Create admin insight for Collection
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // TODO: Add admin authentication check here

    if (!data.contractAddress || !data.title) {
      return NextResponse.json(
        { success: false, error: 'contractAddress and title are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_collection_insights');

    // Check if insights already exist
    const existing = await collection.findOne({
      contractAddress: data.contractAddress.toLowerCase()
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Collection insights already exist' },
        { status: 409 }
      );
    }

    const insight: Omit<AdminCollectionInsight, '_id'> = {
      contractAddress: data.contractAddress.toLowerCase(),
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
    console.error('Error creating admin collection insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create insight' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/insights/collection - Update admin insight for Collection
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // TODO: Add admin authentication check here

    if (!data.contractAddress) {
      return NextResponse.json(
        { success: false, error: 'contractAddress is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_collection_insights');

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
        contractAddress: data.contractAddress.toLowerCase()
      },
      { $set: updateData },
      { upsert: true }
    );

    const updated = await collection.findOne({
      contractAddress: data.contractAddress.toLowerCase()
    });

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error updating admin collection insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/insights/collection - Delete collection insights
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'contractAddress parameter is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('admin_collection_insights');

    const result = await collection.deleteOne({
      contractAddress: contractAddress.toLowerCase()
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Collection insights not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE /api/admin/insights/collection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection insights' },
      { status: 500 }
    );
  }
}