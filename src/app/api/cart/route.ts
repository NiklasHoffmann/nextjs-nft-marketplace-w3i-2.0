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

import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiHandler, apiSuccess, BadRequestError, ForbiddenError } from '@/lib/api';
import { devLog } from '@/utils';

interface CartItem {
    listingId: string;
    contractAddress: string;
    tokenId: string;
    price: string;
    seller: string;
    currency?: string | null;
    tokenStandard?: 'ERC721' | 'ERC1155' | null;
    erc1155QuantityListed?: string | null;
    remainingQuantity?: string | null;
    unitPrice?: string | null;
    partialBuyEnabled?: boolean;
    desiredErc1155Quantity?: string | null;
    feeRate?: string | number | null;
    royaltyFeePercentage?: number | null;
    name?: string;
    imageUrl?: string;
}

interface UserCart {
    walletAddress: string;
    items: CartItem[];
    updatedAt: Date;
}

export const GET = apiHandler(async (request: NextRequest) => {
    const authenticatedUser = request.userAddress as string;

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress')?.toLowerCase();

    if (!walletAddress) {
        throw new BadRequestError('Missing walletAddress');
    }

    if (walletAddress !== authenticatedUser.toLowerCase()) {
        throw new ForbiddenError('Wallet address does not match authenticated user');
    }

    const carts = await getCollection('user_carts');
    const cart = await carts.findOne({ walletAddress }) as UserCart | null;

    return apiSuccess({
        items: cart?.items || [],
        updatedAt: cart?.updatedAt || null
    });
}, { auth: true });

export const POST = apiHandler(async (request: NextRequest) => {
    const authenticatedUser = request.userAddress as string;

    const body = await request.json();
    const { walletAddress, items } = body;

    if (!walletAddress || !Array.isArray(items)) {
        throw new BadRequestError('Missing walletAddress or items');
    }

    const normalizedAddress = walletAddress.toLowerCase();

    if (normalizedAddress !== authenticatedUser.toLowerCase()) {
        throw new ForbiddenError('Wallet address does not match authenticated user');
    }
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

    devLog.info(`✅ [Cart API] Saved cart for ${normalizedAddress}:`, items.length, 'items');

    return apiSuccess({
        itemCount: items.length,
        updatedAt: new Date()
    });
}, { auth: true });

export const DELETE = apiHandler(async (request: NextRequest) => {
    const authenticatedUser = request.userAddress as string;

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress')?.toLowerCase();

    if (!walletAddress) {
        throw new BadRequestError('Missing walletAddress');
    }

    if (walletAddress !== authenticatedUser.toLowerCase()) {
        throw new ForbiddenError('Wallet address does not match authenticated user');
    }

    const carts = await getCollection('user_carts');
    await carts.deleteOne({ walletAddress });

    devLog.info(`🗑️ [Cart API] Cleared cart for ${walletAddress}`);

    return apiSuccess({
        message: 'Cart cleared'
    });
}, { auth: true });
