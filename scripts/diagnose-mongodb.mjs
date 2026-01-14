#!/usr/bin/env node
/**
 * MongoDB Verbindungs-Diagnose Tool
 * 
 * Dieses Tool testet die MongoDB-Verbindung und gibt hilfreiche 
 * Fehlermeldungen aus, besonders bei IP-Whitelist-Problemen.
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;

console.log('\n' + '='.repeat(60));
console.log('🔍 MongoDB Verbindungs-Diagnose');
console.log('='.repeat(60) + '\n');

if (!uri) {
    console.error('❌ MONGODB_URI nicht gefunden in .env.local');
    console.error('\n💡 LÖSUNG:');
    console.error('   1. Erstelle .env.local Datei im Root-Verzeichnis');
    console.error('   2. Füge hinzu: MONGODB_URI=mongodb+srv://...\n');
    process.exit(1);
}

// Extract hostname from URI for display
const uriMatch = uri.match(/@([^/]+)/);
const hostname = uriMatch ? uriMatch[1] : 'unknown';

console.log('📍 MongoDB URI gefunden');
console.log(`🌐 Host: ${hostname}\n`);

// Get current public IP
async function getCurrentIP() {
    return new Promise((resolve) => {
        https.get('https://api.ipify.org?format=json', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const ip = JSON.parse(data).ip;
                    resolve(ip);
                } catch {
                    resolve('Unbekannt');
                }
            });
        }).on('error', () => resolve('Unbekannt'));
    });
}

const myIP = await getCurrentIP();
console.log(`🖥️  Deine aktuelle IP: ${myIP}\n`);

console.log('⏳ Teste Verbindung...\n');

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
});

async function diagnose() {
    const startTime = Date.now();

    try {
        console.log('   ├─ Verbinde zum Server...');
        await client.connect();
        console.log('   ✅ Verbindung hergestellt!\n');

        console.log('   ├─ Ping Database...');
        await client.db().admin().ping();
        console.log('   ✅ Ping erfolgreich!\n');

        console.log('   ├─ Liste Datenbanken...');
        const dbs = await client.db().admin().listDatabases();
        console.log('   ✅ Datenbanken gefunden:\n');
        dbs.databases.forEach(db => {
            console.log(`      - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

        const duration = Date.now() - startTime;

        console.log('\n' + '='.repeat(60));
        console.log(`✅ MongoDB Verbindung erfolgreich! (${duration}ms)`);
        console.log('='.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        const duration = Date.now() - startTime;

        console.log(`   ❌ Fehler nach ${duration}ms\n`);
        console.log('='.repeat(60));
        console.log('❌ MONGODB VERBINDUNGSFEHLER');
        console.log('='.repeat(60) + '\n');

        const message = error?.message || '';
        const reason = error?.reason?.type || '';

        // IP Whitelist Problem (häufigster Fall)
        if (
            reason === 'ReplicaSetNoPrimary' ||
            message.includes('ECONNREFUSED') ||
            message.includes('connection refused') ||
            message.includes('SSL alert') ||
            message.includes('tlsv1 alert')
        ) {
            console.log('🚫 DIAGNOSE: IP-Adresse nicht in Whitelist\n');
            console.log('⚠️  HÄUFIGSTE URSACHE:');
            console.log(`   Deine IP-Adresse (${myIP}) ist nicht in MongoDB Atlas freigegeben!\n`);
            console.log('✅ LÖSUNG - SCHRITT FÜR SCHRITT:\n');
            console.log('   1. Öffne https://cloud.mongodb.com');
            console.log('   2. Wähle dein Projekt aus');
            console.log('   3. Klicke auf "Network Access" im linken Menü');
            console.log('   4. Klicke auf "Add IP Address"');
            console.log(`   5. Füge deine IP hinzu: ${myIP}`);
            console.log('   6. ODER für Development: 0.0.0.0/0 (erlaubt alle IPs)\n');
            console.log('💡 HINWEIS:');
            console.log('   Wenn du von zu Hause und vom Büro arbeitest,');
            console.log('   musst du beide IPs hinzufügen!\n');
        }
        // Timeout
        else if (message.includes('timeout') || message.includes('timed out')) {
            console.log('⏱️  DIAGNOSE: Verbindungs-Timeout\n');
            console.log('⚠️  MÖGLICHE URSACHEN:\n');
            console.log('   1. ❗ IP-Adresse nicht in Whitelist (häufigster Fall)');
            console.log('   2. MongoDB Atlas Cluster pausiert');
            console.log('   3. Netzwerkprobleme/Firewall\n');
            console.log('✅ LÖSUNG:\n');
            console.log('   1. Überprüfe Network Access in MongoDB Atlas');
            console.log(`   2. Stelle sicher, dass ${myIP} freigegeben ist\n`);
        }
        // Authentication
        else if (
            message.includes('Authentication failed') ||
            message.includes('auth failed') ||
            message.includes('not authorized')
        ) {
            console.log('🔐 DIAGNOSE: Authentifizierung fehlgeschlagen\n');
            console.log('⚠️  URSACHE:');
            console.log('   Falscher Benutzername oder Passwort\n');
            console.log('✅ LÖSUNG:\n');
            console.log('   1. Überprüfe MONGODB_URI in .env.local');
            console.log('   2. Stelle sicher, dass Sonderzeichen URL-encoded sind');
            console.log('   3. Überprüfe Database User in MongoDB Atlas\n');
        }
        // Generic Error
        else {
            console.log('❓ DIAGNOSE: Unbekannter Fehler\n');
            console.log('⚠️  ÜBERPRÜFE:\n');
            console.log(`   1. IP-Adresse ${myIP} in MongoDB Atlas Network Access`);
            console.log('   2. MONGODB_URI in .env.local');
            console.log('   3. MongoDB Atlas Cluster Status\n');
        }

        console.log('📋 TECHNISCHE DETAILS:\n');
        console.log(`   Error Type: ${error.name}`);
        console.log(`   Message: ${message}`);
        if (reason) {
            console.log(`   Reason: ${reason}`);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        process.exit(1);
    } finally {
        await client.close();
    }
}

diagnose();
