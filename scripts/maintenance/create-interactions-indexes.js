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

async function createIndexes() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const collections = [
      { name: 'user_likes', indexName: 'user_likes_unique' },
      { name: 'user_watchlist', indexName: 'user_watchlist_unique' },
      { name: 'user_ratings', indexName: 'user_ratings_unique' }
    ];

    for (const { name, indexName } of collections) {
      await db.collection(name).createIndex(
        { userId: 1, contractAddress: 1, tokenId: 1 },
        { unique: true, background: true, name: indexName }
      );
    }

    console.log('Indexes created successfully.');
  } finally {
    await client.close();
  }
}

createIndexes().catch((error) => {
  console.error(error);
  process.exit(1);
});
