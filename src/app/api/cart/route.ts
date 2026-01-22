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
import { apiHandler } from '@/lib/api/handler';
import { withAuth } from '@/lib/middleware';
import { apiBadRequest } from '@/lib/api/responses';

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

export const GET = apiHandler(async (request: NextRequest) => {
    await withAuth(request);
    // @ts-ignore
    const authenticatedUser = request.userAddress as string;

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress')?.toLowerCase();

    if (!walletAddress) {
        return apiBadRequest('Missing walletAddress');
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
});

export const POST = apiHandler(async (request: NextRequest) => {
    await withAuth(request);
    // @ts-ignore
    const authenticatedUser = request.userAddress as string;

    const body = await request.json();
    const { walletAddress, items } = body;

    if (!walletAddress || !Array.isArray(items)) {
        return apiBadRequest('Missing walletAddress or items');
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
});

export const DELETE = apiHandler(async (request: NextRequest) => {
    await withAuth(request);
    // @ts-ignore
    const authenticatedUser = request.userAddress as string;

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress')?.toLowerCase();

    if (!walletAddress) {
        return apiBadRequest('Missing walletAddress');
    }

    const carts = await getCollection('user_carts');
    await carts.deleteOne({ walletAddress });

    console.log(`🗑️ [Cart API] Cleared cart for ${walletAddress}`);

    return NextResponse.json({
        success: true,
        message: 'Cart cleared'
    });
});
