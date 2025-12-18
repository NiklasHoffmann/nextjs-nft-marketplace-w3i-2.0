/**
 * Shopping Cart API
 * 
 * Wallet-based cart storage for cross-device synchronization
 * 
 * GET /api/cart?walletAddress=0x...
 * - Returns cart items for wallet
 * 
 * POST /api/cart
 * - Body: { walletAddress, items }
 * - Upserts entire cart (replaces existing)
 * 
 * DELETE /api/cart?walletAddress=0x...
 * - Clears cart for wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

interface CartItem {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    price: string;
    seller: string;
    name?: string;
    imageUrl?: string;
}

interface UserCart {
    walletAddress: string;
    items: CartItem[];
    updatedAt: Date;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress')?.toLowerCase();

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress' },
                { status: 400 }
            );
        }

        const carts = await getCollection('user_carts');
        const cart = await carts.findOne({ walletAddress }) as UserCart | null;

        return NextResponse.json({
            success: true,
            data: {
                items: cart?.items || [],
                updatedAt: cart?.updatedAt || null
            }
        });

    } catch (error) {
        console.error('❌ [Cart API] GET failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cart' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, items } = body;

        if (!walletAddress || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Missing walletAddress or items' },
                { status: 400 }
            );
        }

        const normalizedAddress = walletAddress.toLowerCase();
        const carts = await getCollection('user_carts');

        // Upsert cart (replace entire cart)
        await carts.updateOne(
            { walletAddress: normalizedAddress },
            {
                $set: {
                    walletAddress: normalizedAddress,
                    items,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        console.log(`✅ [Cart API] Saved cart for ${normalizedAddress}:`, items.length, 'items');

        return NextResponse.json({
            success: true,
            data: {
                itemCount: items.length,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error('❌ [Cart API] POST failed:', error);
        return NextResponse.json(
            { error: 'Failed to save cart' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress')?.toLowerCase();

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress' },
                { status: 400 }
            );
        }

        const carts = await getCollection('user_carts');
        await carts.deleteOne({ walletAddress });

        console.log(`🗑️ [Cart API] Cleared cart for ${walletAddress}`);

        return NextResponse.json({
            success: true,
            message: 'Cart cleared'
        });

    } catch (error) {
        console.error('❌ [Cart API] DELETE failed:', error);
        return NextResponse.json(
            { error: 'Failed to clear cart' },
            { status: 500 }
        );
    }
}
