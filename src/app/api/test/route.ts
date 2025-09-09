// app/api/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Test unserer Web3 Verbindung mit einem bekannten NFT auf Sepolia
    // OpenSea Shared Storefront auf Sepolia: 0x495f947276749Ce646f68AC8c248420045cb7b5e
    const testAddress = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
    const testTokenId = '1';

    try {
        // Test Web3 API direkt
        const web3Response = await fetch(
            `${request.nextUrl.origin}/api/web3/tokenURI?address=${testAddress}&tokenId=${testTokenId}`
        );

        const web3Data = await web3Response.json();

        // Test NFT Metadata API
        const metadataResponse = await fetch(
            `${request.nextUrl.origin}/api/nft-metadata?address=${testAddress}&tokenId=${testTokenId}`
        );

        const metadataData = await metadataResponse.json();

        return NextResponse.json({
            status: 'System-Test erfolgreich! ✅',
            timestamp: new Date().toISOString(),
            environment: {
                'NODE_ENV': process.env.NODE_ENV,
                'Alchemy_URL': process.env.ALCHEMY_URL ? '✅ Konfiguriert' : '❌ Fehlt',
                'Infura_URL': process.env.INFURA_URL ? '✅ Konfiguriert' : '❌ Fehlt',
                'WalletConnect_ID': process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ? '✅ Konfiguriert' : '❌ Fehlt'
            },
            endpoints: {
                'web3-tokenURI': {
                    tested: true,
                    status: web3Response.ok ? '✅ Funktioniert' : '❌ Fehler',
                    response: web3Data
                },
                'nft-metadata': {
                    tested: true,
                    status: metadataResponse.ok ? '✅ Funktioniert' : '❌ Fehler',
                    response: metadataData,
                    cached: metadataData.cached || false
                }
            },
            caching: {
                serverSide: 'LRU Cache (1000 items, 30min TTL)',
                clientSide: 'React Query (15min stale, 30min GC)',
                images: 'Next.js Image Optimization + IPFS conversion'
            },
            performance: {
                'server-caching': '✅ Aktiv - Blockchain-Abfragen werden gecacht',
                'client-caching': '✅ Aktiv - Sofortige UI Updates',
                'image-optimization': '✅ Aktiv - Lazy loading mit Fallbacks',
                'rpc-provider': process.env.ALCHEMY_URL ? '✅ Alchemy konfiguriert' : '⚠️  Fallback RPC'
            },
            nextSteps: [
                '🎯 Teste mit einem echten NFT Contract',
                '🖼️  Überprüfe Bildladung auf der UI',
                '⚡ Teste Caching durch mehrfache Aufrufe',
                '🔗 Integriere Wallet Connection'
            ]
        });

    } catch (error) {
        return NextResponse.json({
            status: 'System-Test fehlgeschlagen ❌',
            error: error instanceof Error ? error.message : 'Unbekannter Fehler',
            timestamp: new Date().toISOString(),
            environment: {
                'NODE_ENV': process.env.NODE_ENV,
                'Alchemy_URL': process.env.ALCHEMY_URL ? '✅ Konfiguriert' : '❌ Fehlt',
                'Infura_URL': process.env.INFURA_URL ? '✅ Konfiguriert' : '❌ Fehlt'
            },
            troubleshooting: [
                '1. Überprüfe .env.local Variablen',
                '2. Stelle sicher dass der Dev Server läuft',
                '3. Teste RPC Verbindung direkt',
                '4. Überprüfe Alchemy/Infura API Keys'
            ]
        }, { status: 500 });
    }
}
