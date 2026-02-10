const path = require('path');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'Ideationmarket_v2';

if (!uri) {
  console.error('Missing MONGODB_URI in .env.local');
  process.exit(1);
}

const collections = [
  { name: 'user_likes', tsField: 'addedAt' },
  { name: 'user_watchlist', tsField: 'addedAt' },
  { name: 'user_ratings', tsField: 'ratedAt' }
];

async function cleanupCollection(db, name, tsField) {
  const coll = db.collection(name);
  const pipeline = [
    {
      $group: {
        _id: {
          userId: '$userId',
          contractAddress: '$contractAddress',
          tokenId: '$tokenId'
        },
        ids: { $push: '$_id' },
        timestamps: { $push: `$${tsField}` },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ];

  const duplicates = await coll.aggregate(pipeline).toArray();
  let removed = 0;

  for (const dup of duplicates) {
    const pairs = dup.ids.map((id, idx) => ({
      id,
      ts: dup.timestamps[idx] ? new Date(dup.timestamps[idx]).getTime() : 0
    }));

    pairs.sort((a, b) => b.ts - a.ts);
    const keepId = pairs[0]?.id;
    const toRemove = pairs.filter((p) => String(p.id) !== String(keepId)).map((p) => p.id);

    if (toRemove.length > 0) {
      const result = await coll.deleteMany({ _id: { $in: toRemove.map((id) => new ObjectId(id)) } });
      removed += result.deletedCount || 0;
    }
  }

  return { collection: name, duplicateGroups: duplicates.length, removed };
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const results = [];

    for (const { name, tsField } of collections) {
      const res = await cleanupCollection(db, name, tsField);
      results.push(res);
    }

    console.log(JSON.stringify({ db: dbName, results }));
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
