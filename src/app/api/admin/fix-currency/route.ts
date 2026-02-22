/**
 * Admin API: Fix Currency Field
 * 
 * POST /api/admin/fix-currency
 * 
 * Manually triggers currency fix for all listings or a specific listing.
 * Reads currency directly from blockchain contract.
 * 
 * Body (optional):
 * - listingId: string - Fix specific listing only
 * 
 * Auth: Admin only
 */

import { NextRequest } from 'next/server';
import { apiHandler, parseJsonBody, BadRequestError } from '@/lib/api';
import { createSuccessResponse } from '@/lib/api';
import { getCurrencyFixSync } from '@/services/nft-sync/currency-fix-sync';

export const POST = apiHandler(async (request: NextRequest) => {
    const body = await parseJsonBody<{ listingId?: string }>(request).catch(() => ({}));
    const { listingId } = body;

    if (listingId !== undefined && (typeof listingId !== 'string' || listingId.trim().length === 0)) {
        throw new BadRequestError('listingId must be a non-empty string when provided');
    }

    const currencyFix = getCurrencyFixSync();

    if (listingId) {
        // Fix specific listing
        const success = await currencyFix.fixListing(listingId);
        return createSuccessResponse({
            message: success
                ? `Currency fixed for listing ${listingId}`
                : `Failed to fix currency for listing ${listingId}`,
            success
        });
    } else {
        // Fix all listings
        const result = await currencyFix.fixAllListings();
        return createSuccessResponse({
            message: `Currency fix completed`,
            fixed: result.fixed,
            errors: result.errors
        });
    }
}, {
    admin: true // Require admin authentication
});
