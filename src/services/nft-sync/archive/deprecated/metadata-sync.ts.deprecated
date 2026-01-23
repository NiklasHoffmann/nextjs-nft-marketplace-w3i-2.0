/**
 * Marketplace Metadata Sync Service
 * 
 * Hintergrund-Service der echte NFT Metadata von der Blockchain holt
 * und in MongoDB speichert - nutzt die existierenden funktionierenden API-Endpunkte
 */

import { getCollection } from '@/lib/mongodb';

interface MetadataApiResponse {
    contractAddress: string;
    tokenId: string;
    metadata: {
        name?: string;
        description?: string;
        image?: string;
        attributes?: Array<{ trait_type: string; value: string | number }>;
    };
    imageUrl?: string;
    cached?: boolean;
    blockchain?: {
        tokenURI?: string;
        name?: string;
        symbol?: string;
        totalSupply?: string | number;
        owner?: string;
        ownerBalance?: number;
        approved?: string; // ✅ ERC-721 approval address
    };
}

export class MarketplaceMetadataSync {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;

    // Sync alle 30 Sekunden
    private readonly SYNC_INTERVAL = 30 * 1000;

    // Batch-Größe: 20 NFTs gleichzeitig (increased for faster initial sync)
    private readonly BATCH_SIZE = 20;

    // Rate Limiting: 1 Sekunde Pause zwischen Batches
    private readonly BATCH_DELAY = 1000;

    constructor() {
        console.log('📦 MarketplaceMetadataSync Service initialisiert');
    }

    /**
     * Startet den automatischen Sync-Service
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Metadata-Sync läuft bereits');
            return;
        }

        console.log('🚀 Starte Metadata-Sync Service...');
        this.isRunning = true;

        // Sofort einmal ausführen
        this.syncMetadata().catch(console.error);

        // Dann regelmäßig
        this.intervalId = setInterval(() => {
            this.syncMetadata().catch(console.error);
        }, this.SYNC_INTERVAL);
    }

    /**
     * Stoppt den Sync-Service
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stoppe Metadata-Sync Service...');
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Sync-Logik: Holt fehlende Metadata für NFTs
     */
    private async syncMetadata() {
        if (!this.isRunning) return;

        try {
            const collection = await getCollection('marketplace_items');

            // Finde NFTs die Metadata/Approval Sync brauchen
            // NEW ARCHITECTURE: metadata is in nft_metadata collection, so check lastSync timestamps
            // Exclude collection-level entries (they don't have tokenId)
            const nftsNeedingMetadata = await collection
                .find({
                    tokenId: { $ne: null }, // Must have a tokenId (exclude collection-level entries)
                    isCollectionLevel: { $ne: true }, // Explicitly exclude collection-level entries
                    active: true, // 🔥 FIXED: Use 'active' field from V2 schema
                    $or: [
                        { 'lastSync.metadata': null }, // Never synced metadata
                        { 'lastSync.metadata': { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Metadata older than 24h
                        { 'lastSync.approval': null }, // Never synced approval
                        { 'lastSync.approval': { $lt: new Date(Date.now() - 5 * 60 * 1000) } }, // Approval older than 5 min
                        // 🔥 NEW: Also refresh if approval is 0x000... (invalid)
                        { approved: null },
                        { approved: '0x0000000000000000000000000000000000000000' },
                        { approved: { $exists: false } }
                    ]
                })
                .limit(this.BATCH_SIZE)
                .toArray();

            if (nftsNeedingMetadata.length === 0) {
                console.log('✅ Alle NFTs haben aktuelle Metadata');
                return;
            }

            console.log(`\n🔄 Synce Metadata für ${nftsNeedingMetadata.length} NFTs...`);
            console.log(`   📋 NFTs to sync:`, nftsNeedingMetadata.map(n => `${n.contractAddress?.slice(0,6)}.../${n.tokenId}`).join(', '));

            // Verarbeite in Batches
            for (let i = 0; i < nftsNeedingMetadata.length; i += this.BATCH_SIZE) {
                if (!this.isRunning) break;

                const batch = nftsNeedingMetadata.slice(i, i + this.BATCH_SIZE);

                await Promise.all(
                    batch.map(nft => this.fetchAndUpdateMetadata(nft))
                );

                // Rate Limiting zwischen Batches
                if (i + this.BATCH_SIZE < nftsNeedingMetadata.length) {
                    await this.sleep(this.BATCH_DELAY);
                }
            }

        } catch (error) {
            console.error('❌ Fehler beim Metadata-Sync:', error);
        }
    }

    /**
     * Holt Metadata von der existierenden API und updated MongoDB
     */
    private async fetchAndUpdateMetadata(nft: any) {
        try {
            // MIGRATION SUPPORT: Handle both nftAddress and contractAddress
            const contractAddress = nft.contractAddress || nft.nftAddress;
            const tokenId = nft.tokenId;

            if (!contractAddress || !tokenId) {
                console.warn(`  ⚠️ Skipping NFT with missing address or tokenId:`, nft);
                return;
            }

            console.log(`  📡 Fetching metadata: ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}:${tokenId}`);

            // Nutze die EXISTIERENDE funktionierende API!
            // 🔥 NEW: Force refresh approval to get current blockchain state
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(
                `${baseUrl}/api/nft/metadata?address=${contractAddress}&tokenId=${tokenId}&refreshApproval=true`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                console.error(`  ❌ API Error ${response.status} für ${contractAddress}:${tokenId}`);
                return;
            }

            const data: MetadataApiResponse = await response.json();
            
            console.log(`  📦 API Response for ${tokenId}:`, {
                hasBlockchain: !!data.blockchain,
                approved: data.blockchain?.approved || 'NONE',
                cached: data.cached
            });

            if (!data.metadata) {
                console.warn(`  ⚠️ Keine Metadata für ${contractAddress}:${tokenId}`);
                return;
            }

            // ✅ NEW ARCHITECTURE: Store metadata in nft_metadata collection, NOT marketplace_items!
            const metadataCollection = await getCollection('nft_metadata');

            const metadataDoc: any = {
                contractAddress,
                tokenId,
                metadata: {
                    name: data.metadata.name || `NFT #${tokenId}`,
                    description: data.metadata.description || '',
                    image: data.metadata.image || data.imageUrl || '',
                    attributes: data.metadata.attributes || []
                },
                contract: {
                    name: data.blockchain?.name || null,
                    symbol: data.blockchain?.symbol || null,
                    address: contractAddress,
                    totalSupply: data.blockchain?.totalSupply || null,
                    tokenURI: data.blockchain?.tokenURI || null,
                    owner: data.blockchain?.owner || null,
                    ownerBalance: data.blockchain?.ownerBalance || null,
                    approved: data.blockchain?.approved || null, // ✅ ERC-721 approval status
                },
                metadataLastSync: new Date(),
                metadataSource: 'blockchain',
                updatedAt: new Date()
            };

            // Upsert to nft_metadata (separate collection)
            await metadataCollection.updateOne(
                { contractAddress, tokenId },
                {
                    $set: metadataDoc,
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            );

            // ✅ Only update sync timestamp in marketplace_items (keep it clean!)
            const marketplaceCollection = await getCollection('marketplace_items');
            const marketplaceUpdateResult = await marketplaceCollection.updateOne(
                { contractAddress, tokenId },
                { 
                    $set: { 
                        'lastSync.metadata': new Date(),
                        'lastSync.approval': new Date(), // Track approval sync separately
                        approved: data.blockchain?.approved || null, // Also store in marketplace_items for quick access
                        approvedAddress: data.blockchain?.approved || null
                    } 
                }
            );

            console.log(`  ✅ Updated: ${data.metadata?.name || tokenId} | Approval: ${data.blockchain?.approved || 'NULL'} | Matched: ${marketplaceUpdateResult.matchedCount} | Modified: ${marketplaceUpdateResult.modifiedCount}`);

        } catch (error) {
            const contractAddress = nft.contractAddress || nft.nftAddress || 'unknown';
            console.error(`  ❌ Fehler bei ${contractAddress}:${nft.tokenId}:`, error);
        }
    }

    /**
     * Helper: Sleep-Funktion für Rate Limiting
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Status des Services
     */
    getStatus() {
        return {
            running: this.isRunning,
            syncInterval: this.SYNC_INTERVAL,
            batchSize: this.BATCH_SIZE
        };
    }
}

// Singleton-Instanz
export const marketplaceMetadataSync = new MarketplaceMetadataSync();
