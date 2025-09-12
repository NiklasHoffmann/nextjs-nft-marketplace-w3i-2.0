import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import {
    CollectionInsights,
    CreateCollectionInsightsRequest,
    UpdateCollectionInsightsRequest,
    CollectionInsightsResponse
} from '@/types/insights';
import { ObjectId } from 'mongodb';

// GET /api/insights/collection - Get collection insights
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const contractAddress = searchParams.get('contractAddress');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');
        const sortBy = searchParams.get('sortBy') || 'updatedAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

        const collection = await getCollection('collection_insights');

        // Build filter
        const filter: any = {};
        if (contractAddress) {
            filter.contractAddress = contractAddress.toLowerCase();
        }

        const results = await collection
            .find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .toArray();

        const response: CollectionInsightsResponse = {
            success: true,
            data: results as CollectionInsights[]
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('GET /api/insights/collection error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch collection insights' },
            { status: 500 }
        );
    }
}

// POST /api/insights/collection - Create new collection insights
export async function POST(request: NextRequest) {
    try {
        const body: CreateCollectionInsightsRequest = await request.json();

        if (!body.contractAddress) {
            return NextResponse.json(
                { success: false, error: 'contractAddress is required' },
                { status: 400 }
            );
        }

        const collection = await getCollection('collection_insights');

        // Check if insights already exist
        const existing = await collection.findOne({
            contractAddress: body.contractAddress.toLowerCase()
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Insights already exist for this collection' },
                { status: 409 }
            );
        }

        const now = new Date();
        const newInsights: Omit<CollectionInsights, '_id'> = {
            contractAddress: body.contractAddress.toLowerCase(),
            chainId: body.chainId,
            name: body.name,
            symbol: body.symbol,
            description: body.description,
            website: body.website,
            discord: body.discord,
            twitter: body.twitter,
            floorPrice: body.floorPrice,
            totalVolume: body.totalVolume,
            totalSales: body.totalSales,
            holderCount: body.holderCount,
            marketCap: body.marketCap,
            priceChange24h: body.priceChange24h,
            priceChange7d: body.priceChange7d,
            priceChange30d: body.priceChange30d,
            volumeChange24h: body.volumeChange24h,
            rarityDistribution: body.rarityDistribution,
            socialMetrics: body.socialMetrics,
            sentiment: body.sentiment,
            investmentRating: body.investmentRating,
            riskAssessment: body.riskAssessment,
            marketPosition: body.marketPosition,
            totalSupply: body.totalSupply,
            mintDate: body.mintDate,
            royalties: body.royalties,
            isWatched: body.isWatched || false,
            personalNotes: body.personalNotes,
            createdAt: now,
            updatedAt: now,
            dataLastUpdated: now
        };

        const result = await collection.insertOne(newInsights);

        const response: CollectionInsightsResponse = {
            success: true,
            data: { ...newInsights, _id: result.insertedId } as CollectionInsights
        };

        return NextResponse.json(response, { status: 201 });

    } catch (error) {
        console.error('POST /api/insights/collection error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create collection insights' },
            { status: 500 }
        );
    }
}

// PUT /api/insights/collection - Update collection insights
export async function PUT(request: NextRequest) {
    try {
        const body: UpdateCollectionInsightsRequest = await request.json();

        if (!body._id) {
            return NextResponse.json(
                { success: false, error: '_id is required for updates' },
                { status: 400 }
            );
        }

        const collection = await getCollection('collection_insights');

        const updateDoc: any = {
            ...body,
            updatedAt: new Date()
        };
        delete updateDoc._id;

        const result = await collection.updateOne(
            { _id: new ObjectId(body._id.toString()) },
            { $set: updateDoc }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Collection insights not found' },
                { status: 404 }
            );
        }

        const updated = await collection.findOne(
            { _id: new ObjectId(body._id.toString()) }
        );

        const response: CollectionInsightsResponse = {
            success: true,
            data: updated as CollectionInsights
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('PUT /api/insights/collection error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update collection insights' },
            { status: 500 }
        );
    }
}

// DELETE /api/insights/collection - Delete collection insights
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'id parameter is required' },
                { status: 400 }
            );
        }

        const collection = await getCollection('collection_insights');

        const result = await collection.deleteOne(
            { _id: new ObjectId(id) }
        );

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Collection insights not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('DELETE /api/insights/collection error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete collection insights' },
            { status: 500 }
        );
    }
}