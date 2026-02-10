const path = require('path');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'Ideationmarket_v2';

if (!uri) {
  console.error('Missing MONGODB_URI in .env.local');
  process.exit(1);
}

async function resetViews() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const viewsResult = await db.collection('nft_views').deleteMany({});
    const statsResult = await db.collection('nft_stats').updateMany(
      {},
      { $set: { viewCount: 0, lastUpdated: new Date() } }
    );

    console.log(
      JSON.stringify({
        deletedViews: viewsResult.deletedCount,
        updatedStats: statsResult.modifiedCount,
      })
    );
  } finally {
    await client.close();
  }
}

resetViews().catch((error) => {
  console.error(error);
  process.exit(1);
});
