const { MongoClient } = require('mongodb');

async function checkApprovedStatus() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://hoffmannmatthias136:w9g77B9HJNY9AW0R@cluster0.1wcro.mongodb.net/Ideationmarket_v2?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('marketplace_items');

        console.log('\n🔍 Checking approved field for all listings...\n');

        const listings = await collection.find({ isListed: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        console.log(`Found ${listings.length} active listings:\n`);

        listings.forEach((listing, index) => {
            console.log(`${index + 1}. NFT #${listing.tokenId} (${listing.contractAddress?.slice(0, 8)}...)`);
            console.log(`   Listing ID: ${listing.listingId}`);
            console.log(`   Seller: ${listing.seller}`);
            console.log(`   Price: ${listing.price}`);
            console.log(`   Approved: ${listing.approved || 'NULL'}`);
            console.log(`   ApprovedAddress: ${listing.approvedAddress || 'NULL'}`);
            console.log(`   lastSync.approval: ${listing.lastSync?.approval || 'NULL'}`);
            console.log(`   Created: ${listing.createdAt}`);
            console.log(`   Synced: ${listing.syncedAt}`);
            console.log('');
        });

        // Count how many have 0x000... or null
        const withNullApproval = await collection.countDocuments({
            isListed: true,
            $or: [
                { approved: null },
                { approved: '0x0000000000000000000000000000000000000000' },
                { approved: { $exists: false } }
            ]
        });

        const totalActive = await collection.countDocuments({ isListed: true });

        console.log(`📊 Summary:`);
        console.log(`   Total active listings: ${totalActive}`);
        console.log(`   With NULL/0x000 approval: ${withNullApproval}`);
        console.log(`   With valid approval: ${totalActive - withNullApproval}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkApprovedStatus();
