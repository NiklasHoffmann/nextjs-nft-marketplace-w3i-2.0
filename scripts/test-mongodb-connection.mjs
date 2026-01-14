import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
}

console.log('🔍 Testing MongoDB connection...');
console.log('📍 URI:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
});

async function testConnection() {
    try {
        console.log('⏳ Connecting...');
        await client.connect();
        console.log('✅ Connected to MongoDB');

        console.log('⏳ Pinging...');
        await client.db().admin().ping();
        console.log('✅ Ping successful');

        console.log('⏳ Listing databases...');
        const dbs = await client.db().admin().listDatabases();
        console.log('✅ Databases:', dbs.databases.map(db => db.name).join(', '));

        console.log('\n✅ MongoDB connection is healthy!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ MongoDB connection failed:');
        console.error('Error:', error.message);
        if (error.reason) {
            console.error('Reason:', error.reason);
        }
        process.exit(1);
    } finally {
        await client.close();
    }
}

testConnection();
