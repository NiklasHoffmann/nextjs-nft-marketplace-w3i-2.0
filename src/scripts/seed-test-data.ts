import { getDatabase } from '@/lib/mongodb';

async function seedTestData() {
    try {
        const db = await getDatabase();

        // Test Public NFT Insights
        const publicInsightData = {
            contractAddress: "0x8f3D90b0c63ce3b7e6Db95e12F3b10Ab1e3b8c2a",
            tokenId: "1",
            nftName: "Test Utility NFT",
            collectionName: "Test Collection",
            description: "A test NFT for demonstrating utility marketplace features",
            utilities: [
                {
                    name: "Access Token",
                    description: "Provides access to exclusive community features",
                    category: "access",
                    isActive: true
                },
                {
                    name: "Governance Voting",
                    description: "Allows participation in DAO governance decisions",
                    category: "governance",
                    isActive: true
                }
            ],
            functions: [
                {
                    name: "Stake for Rewards",
                    description: "Stake this NFT to earn platform tokens",
                    category: "defi",
                    isActive: true,
                    requirements: ["Minimum 30-day hold period"]
                }
            ],
            marketData: {
                currentFloorPrice: "0.5",
                currency: "ETH",
                marketCap: "1000",
                totalSupply: 10000,
                uniqueHolders: 5000
            },
            riskProfile: {
                contractAuditStatus: "audited",
                teamKYCStatus: "verified",
                liquidityScore: 8.5,
                volatilityScore: 6.2
            },
            communityData: {
                discordMembers: 15000,
                twitterFollowers: 25000,
                activeUsers24h: 1200
            },
            lastUpdated: new Date(),
            createdAt: new Date()
        };

        // Insert or update public insights
        await db.collection('public_nft_insights').updateOne(
            {
                contractAddress: publicInsightData.contractAddress,
                tokenId: publicInsightData.tokenId
            },
            { $set: publicInsightData },
            { upsert: true }
        );

        console.log('✅ Test public insights data seeded successfully');

        // Test User Interaction Data
        const userInteractionData = {
            contractAddress: "0x8f3D90b0c63ce3b7e6Db95e12F3b10Ab1e3b8c2a",
            tokenId: "1",
            userWalletAddress: "0x8BbA5E9b30E986C55465fEaC4D3417791065d1bb",
            personalRating: 4,
            isFavorite: true,
            isWatchlisted: true,
            personalNotes: "Great utility NFT with solid roadmap. Good for long-term holding.",
            interactionHistory: [
                {
                    action: "rated",
                    value: "4",
                    timestamp: new Date()
                },
                {
                    action: "favorited",
                    timestamp: new Date()
                }
            ],
            createdAt: new Date(),
            lastUpdated: new Date()
        };

        // Insert or update user interactions
        await db.collection('user_nft_interactions').updateOne(
            {
                contractAddress: userInteractionData.contractAddress,
                tokenId: userInteractionData.tokenId,
                userWalletAddress: userInteractionData.userWalletAddress
            },
            { $set: userInteractionData },
            { upsert: true }
        );

        console.log('✅ Test user interaction data seeded successfully');

        return { success: true, message: 'Test data seeded successfully' };

    } catch (error) {
        console.error('❌ Error seeding test data:', error);
        return { success: false, error: String(error) };
    }
}

// Export for use in API routes or direct execution
export { seedTestData };

// Allow direct execution
if (require.main === module) {
    seedTestData()
        .then(result => {
            console.log('Seed result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Seed error:', error);
            process.exit(1);
        });
}