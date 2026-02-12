import { getDatabase } from '@/lib/mongodb';

const CHAIN_ID = 11155111;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const mockListings = [
    {
        listingId: '9001',
        contractAddress: '0x5b7d2f9b6d6e6f9c3f5d7a2b4c6e8f0b1a2c3d4e',
        tokenId: '1',
        seller: '0x8bba5e9b30e986c55465feac4d3417791065d1bb',
        quantity: '25',
        unitPrice: '10000000000000000', // 0.01 ETH
        name: 'Mock ERC1155 #1',
        image: '/media/custom-nft-3.jpg'
    },
    {
        listingId: '9002',
        contractAddress: '0x5b7d2f9b6d6e6f9c3f5d7a2b4c6e8f0b1a2c3d4e',
        tokenId: '2',
        seller: '0x8bba5e9b30e986c55465feac4d3417791065d1bb',
        quantity: '10',
        unitPrice: '25000000000000000', // 0.025 ETH
        name: 'Mock ERC1155 #2',
        image: '/media/custom-nft-4.jpg'
    },
    {
        listingId: '9003',
        contractAddress: '0x9f1a7b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2',
        tokenId: '7',
        seller: '0x8bba5e9b30e986c55465feac4d3417791065d1bb',
        quantity: '50',
        unitPrice: '5000000000000000', // 0.005 ETH
        name: 'Mock ERC1155 #7',
        image: '/media/custom-nft-5.jpg'
    }
];

async function seedErc1155Listings() {
    const db = await getDatabase();
    const marketplaceItems = db.collection('marketplace_items');
    const nftMetadata = db.collection('nft_metadata');
    const now = new Date();

    for (const listing of mockListings) {
        const contractAddress = listing.contractAddress.toLowerCase();
        const priceTotal = (BigInt(listing.unitPrice) * BigInt(listing.quantity)).toString();

        await marketplaceItems.updateOne(
            {
                contractAddress,
                tokenId: listing.tokenId,
                listingId: listing.listingId
            },
            {
                $set: {
                    listingId: listing.listingId,
                    chainId: CHAIN_ID,
                    contractAddress,
                    nftAddress: contractAddress,
                    tokenId: listing.tokenId,
                    price: priceTotal,
                    seller: listing.seller.toLowerCase(),
                    isListed: true,
                    active: true,
                    listingType: 'PURE_ETH',
                    createdAt: now,
                    syncedAt: now,
                    status: 'LISTED',
                    tokenStandard: 'ERC1155',
                    currency: ZERO_ADDRESS,
                    feeRate: '0',
                    priceTotal,
                    unitPrice: listing.unitPrice,
                    buyerWhitelistEnabled: false,
                    partialBuyEnabled: true,
                    erc1155QuantityListed: listing.quantity,
                    remainingQuantity: listing.quantity,
                    desiredTokenAddress: ZERO_ADDRESS,
                    desiredTokenId: '0',
                    desiredErc1155Quantity: '0',
                    buyer: ZERO_ADDRESS
                },
                $setOnInsert: {
                    firstSyncedAt: now
                }
            },
            { upsert: true }
        );

        await nftMetadata.updateOne(
            {
                contractAddress,
                tokenId: listing.tokenId
            },
            {
                $set: {
                    contractAddress,
                    tokenId: listing.tokenId,
                    isListed: true,
                    listingId: listing.listingId,
                    metadata: {
                        name: listing.name,
                        description: 'Mock ERC1155 listing seeded for marketplace testing.',
                        image: listing.image,
                        attributes: []
                    },
                    contract: {
                        name: 'Mock ERC1155 Collection',
                        symbol: 'M1155',
                        address: contractAddress,
                        tokenURI: null,
                        contractType: 'ERC1155'
                    },
                    blockchain: {
                        owner: listing.seller.toLowerCase(),
                        approved: null,
                        isApprovedForAll: false,
                        lastSyncedAt: now
                    },
                    updatedAt: now
                },
                $setOnInsert: {
                    createdAt: now,
                    ownershipHistory: []
                }
            },
            { upsert: true }
        );
    }

    return {
        success: true,
        count: mockListings.length
    };
}

if (require.main === module) {
    seedErc1155Listings()
        .then((result) => {
            console.log(`✅ Seeded ${result.count} ERC1155 listings`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Failed to seed ERC1155 listings:', error);
            process.exit(1);
        });
}

export { seedErc1155Listings };
