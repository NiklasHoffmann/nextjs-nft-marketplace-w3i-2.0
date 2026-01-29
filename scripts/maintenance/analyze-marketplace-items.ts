/**
 * Analyze: Check all marketplace_items for structural inconsistencies
 * 
 * Purpose: Find items with missing/wrong fields that prevent display
 * 
 * Usage: npx tsx scripts/maintenance/analyze-marketplace-items.ts
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
function loadEnv() {
    const envPath = path.resolve(__dirname, '../../.env.local');
    
    if (!fs.existsSync(envPath)) {
        throw new Error('.env.local not found');
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = envContent.split('\n');
    
    for (const line of envVars) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    }
}

function analyzeFieldType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') {
        if (value.$numberLong) return `BSON Long: ${value.$numberLong}`;
        if (value.$date) return `BSON Date: ${value.$date}`;
        return `object{${Object.keys(value).join(',')}}`;
    }
    return typeof value;
}

async function analyzeMarketplaceItems() {
    let client: MongoClient | null = null;
    
    try {
        console.log('🔍 Analyzing marketplace_items structure...\n');

        // Load environment variables
        loadEnv();

        // Check MongoDB URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env.local');
        }

        console.log('📡 Connecting to MongoDB...');
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected!\n');

        const db = client.db();
        const marketplaceItems = db.collection('marketplace_items');
        
        console.log('📦 Fetching all items...');
        const items = await marketplaceItems.find({}).toArray();
        console.log(`   Found ${items.length} items\n`);
        
        if (items.length === 0) {
            console.log('⚠️  No items found!');
            return;
        }
        
        // Expected fields (from TheGraph v2 sync)
        const expectedFields = [
            'listingId',
            'contractAddress',
            'nftAddress',
            'tokenId',
            'active',
            'isListed',
            'price',
            'priceTotal',
            'unitPrice',
            'seller',
            'buyer',
            'chainId',
            'createdAt',
            'syncedAt',
            'listingType',
            'status',
            'tokenStandard',
            'currency',
            'feeRate'
        ];
        
        console.log('🔍 Analyzing field types and consistency...\n');
        
        // Analyze each field
        const fieldAnalysis = new Map<string, Map<string, number>>();
        
        for (const item of items) {
            for (const field of expectedFields) {
                if (!fieldAnalysis.has(field)) {
                    fieldAnalysis.set(field, new Map());
                }
                
                const typeMap = fieldAnalysis.get(field)!;
                const fieldType = analyzeFieldType(item[field]);
                typeMap.set(fieldType, (typeMap.get(fieldType) || 0) + 1);
            }
        }
        
        // Report inconsistencies
        console.log('📊 Field Type Analysis:\n');
        
        const inconsistencies: string[] = [];
        
        for (const [field, typeMap] of fieldAnalysis.entries()) {
            const types = Array.from(typeMap.entries());
            
            if (types.length > 1) {
                console.log(`⚠️  ${field}:`);
                for (const [type, count] of types) {
                    console.log(`     - ${type}: ${count} item(s)`);
                }
                inconsistencies.push(field);
            } else {
                console.log(`✅ ${field}: ${types[0][0]} (all ${types[0][1]} items)`);
            }
        }
        
        if (inconsistencies.length > 0) {
            console.log(`\n⚠️  Found ${inconsistencies.length} fields with type inconsistencies!\n`);
            
            // Show problematic items
            console.log('🔎 Items with unusual structure:\n');
            
            for (const item of items) {
                const issues: string[] = [];
                
                // Check for type mismatches
                for (const field of inconsistencies) {
                    const fieldType = analyzeFieldType(item[field]);
                    
                    // Check common issues
                    if (field === 'tokenId' && typeof item[field] === 'number') {
                        issues.push(`tokenId is number (should be string)`);
                    }
                    if ((field === 'price' || field === 'priceTotal' || field === 'unitPrice') && typeof item[field] === 'object') {
                        issues.push(`${field} is BSON Long (should be string)`);
                    }
                    if (field === 'listingId' && typeof item[field] === 'object') {
                        issues.push(`listingId is BSON Long (should be string)`);
                    }
                    if ((field === 'contractAddress' || field === 'nftAddress') && item[field]?.toLowerCase() !== item[field]) {
                        issues.push(`${field} not lowercase`);
                    }
                }
                
                // Check for missing critical fields
                if (!item.contractAddress && !item.nftAddress) {
                    issues.push('MISSING contractAddress/nftAddress');
                }
                if (!item.tokenId) {
                    issues.push('MISSING tokenId');
                }
                if (!item.price && !item.priceTotal && !item.unitPrice) {
                    issues.push('MISSING price fields');
                }
                
                if (issues.length > 0) {
                    const contractAddr = item.contractAddress || item.nftAddress || 'unknown';
                    console.log(`❌ Item ${contractAddr} #${item.tokenId} (listingId: ${item.listingId}):`);
                    for (const issue of issues) {
                        console.log(`     - ${issue}`);
                    }
                    
                    // Show full document for debugging
                    console.log('     Full document:');
                    console.log(JSON.stringify(item, null, 2).split('\n').map(line => `     ${line}`).join('\n'));
                    console.log('');
                }
            }
        } else {
            console.log('\n✅ All fields are consistent across all items!');
        }

        console.log('\n✅ Analysis complete!');

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        if (client) {
            console.log('\n📡 Closing MongoDB connection...');
            await client.close();
            console.log('✅ Connection closed');
        }
    }
}

analyzeMarketplaceItems();
