import { apiHandler, apiSuccess } from '@/lib/api';
import { getDatabase } from '@/lib/mongodb';
import { getNFTSyncService } from '@/services/nft-sync';
import '@/lib/dev-services-auto-start';

export const GET = apiHandler(async () => {
  const db = await getDatabase();
  const syncService = getNFTSyncService();
  const syncStatus = syncService.getStatus();

  const [marketplaceCount, metadataCount, statsCount] = await Promise.all([
    db.collection('marketplace_items').countDocuments({}),
    db.collection('nft_metadata').countDocuments({}),
    db.collection('nft_stats').countDocuments({}),
  ]);

  return apiSuccess({
    process: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    database: {
      marketplaceItems: marketplaceCount,
      nftMetadata: metadataCount,
      nftStats: statsCount,
    },
    syncService: syncStatus,
  });
}, { admin: true });
