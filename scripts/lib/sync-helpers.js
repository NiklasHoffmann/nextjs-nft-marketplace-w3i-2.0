/**
 * Helper functions for marketplace sync to new architecture
 * Separates NFT metadata from marketplace listings
 */

/**
 * Upsert NFT metadata to nft_metadata collection
 * @param {Collection} metadataCollection - MongoDB nft_metadata collection
 * @param {object} data - NFT data
 * @returns {Promise<void>}
 */
async function upsertNFTMetadata(metadataCollection, data) {
    const {
        nftAddress,
        tokenId,
        metadata,
        contract,
        insights,
        seller, // Current owner (if listed)
    } = data;

    const filter = { nftAddress, tokenId };

    const update = {
        $set: {
            lastVerified: new Date(),
            updatedAt: new Date()
        },
        $setOnInsert: {
            nftAddress,
            tokenId,
            createdAt: new Date()
        }
    };

    // Update metadata if provided
    if (metadata) {
        update.$set.metadata = metadata;
        update.$set.metadataLastUpdated = new Date();
    }

    // Update contract info if provided
    if (contract) {
        update.$set.contract = contract;
    }

    // Update insights if provided
    if (insights) {
        update.$set.insights = insights;
        update.$set.insightsLastUpdated = new Date();
    }

    // Update owner if provided (seller is current owner if listed)
    if (seller) {
        update.$set.currentOwner = seller.toLowerCase();

        // Add to owner history if owner changed
        const existing = await metadataCollection.findOne(filter);
        if (existing && existing.currentOwner !== seller.toLowerCase()) {
            update.$push = {
                ownerHistory: {
                    owner: seller.toLowerCase(),
                    timestamp: new Date(),
                    source: 'marketplace_sync'
                }
            };
        } else if (!existing) {
            // First time seeing this NFT, initialize owner history
            update.$set.ownerHistory = [{
                owner: seller.toLowerCase(),
                timestamp: new Date(),
                source: 'marketplace_sync'
            }];
        }
    }

    await metadataCollection.updateOne(filter, update, { upsert: true });
}

/**
 * Upsert marketplace listing to marketplace_items collection
 * @param {Collection} marketplaceCollection - MongoDB marketplace_items collection
 * @param {object} data - Listing data
 * @returns {Promise<void>}
 */
async function upsertMarketplaceListing(marketplaceCollection, data) {
    const {
        listingId,
        nftAddress,
        tokenId,
        isListed,
        price,
        seller,
        buyer,
        desiredNftAddress,
        desiredTokenId
    } = data;

    const filter = { listingId };

    const update = {
        $set: {
            nftAddress,
            tokenId,
            isListed,
            price: parseFloat(price) || 0,
            seller,
            buyer,
            desiredNftAddress,
            desiredTokenId,
            updatedAt: new Date()
        },
        $setOnInsert: {
            listingId,
            createdAt: new Date(),
            listedAt: new Date()
        }
    };

    await marketplaceCollection.updateOne(filter, update, { upsert: true });
}

/**
 * Check if NFT data has changed (for incremental sync optimization)
 * @param {object} existingListing - Existing marketplace listing
 * @param {object} newData - New data from TheGraph
 * @returns {boolean} True if data changed
 */
function hasListingChanged(existingListing, newData) {
    if (!existingListing) return true;

    const priceChanged = parseFloat(newData.price || '0') !== (existingListing.price || 0);
    const sellerChanged = newData.seller !== existingListing.seller;
    const statusChanged = newData.isListed !== existingListing.isListed;

    return priceChanged || sellerChanged || statusChanged;
}

/**
 * Build enriched NFT document for legacy compatibility (if needed)
 * Combines data from nft_metadata + marketplace_items
 * @param {object} metadataDoc - Document from nft_metadata
 * @param {object} listingDoc - Document from marketplace_items
 * @returns {object} Enriched NFT document
 */
function buildEnrichedNFT(metadataDoc, listingDoc) {
    return {
        nftAddress: metadataDoc.nftAddress,
        tokenId: metadataDoc.tokenId,
        listingId: listingDoc?.listingId,
        metadata: metadataDoc.metadata,
        contract: metadataDoc.contract,
        insights: metadataDoc.insights,
        marketplace: listingDoc ? {
            listingId: listingDoc.listingId,
            isListed: listingDoc.isListed,
            price: listingDoc.price,
            seller: listingDoc.seller,
            buyer: listingDoc.buyer,
            desiredNftAddress: listingDoc.desiredNftAddress,
            desiredTokenId: listingDoc.desiredTokenId,
            listedAt: listingDoc.listedAt
        } : null,
        dataQuality: {
            hasMetadata: !!metadataDoc.metadata,
            hasInsights: !!(metadataDoc.insights?.category || metadataDoc.insights?.rarity),
            metadataSource: metadataDoc.metadata ? 'ipfs' : 'none'
        },
        createdAt: metadataDoc.createdAt,
        lastUpdated: metadataDoc.updatedAt,
        metadataLastUpdated: metadataDoc.metadataLastUpdated,
        insightsLastUpdated: metadataDoc.insightsLastUpdated
    };
}

module.exports = {
    upsertNFTMetadata,
    upsertMarketplaceListing,
    hasListingChanged,
    buildEnrichedNFT
};
