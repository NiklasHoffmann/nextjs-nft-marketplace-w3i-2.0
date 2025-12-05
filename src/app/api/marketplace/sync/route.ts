/**
 * NFT Sync Service Status & Control API
 * 
 * GET /api/marketplace/sync - Get sync service status
 * POST /api/marketplace/sync - Start/stop sync service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNFTSyncService } from '@/services/nft-sync';

// Auto-start service on module load (server-side only)
if (typeof window === 'undefined') {
    let autoStarted = false;

    if (!autoStarted) {
        autoStarted = true;

        // Use setImmediate to avoid blocking module initialization
        setImmediate(async () => {
            try {
                const syncService = getNFTSyncService();
                const status = syncService.getStatus();

                if (!status.isRunning) {
                    console.log('🚀 Auto-starting NFT Sync Service...');
                    await syncService.start();
                    console.log('✅ NFT Sync Service auto-started successfully');
                }
            } catch (error) {
                console.error('❌ Failed to auto-start NFT Sync Service:', error);
            }
        });
    }
}

export async function GET(request: NextRequest) {
    try {
        const syncService = getNFTSyncService();
        const status = syncService.getStatus();

        return NextResponse.json({
            success: true,
            data: status,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('❌ Sync status error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body; // 'start' or 'stop'

        const syncService = getNFTSyncService();

        if (action === 'start') {
            await syncService.start();
            return NextResponse.json({
                success: true,
                message: 'Sync service started',
                timestamp: Date.now()
            });
        } else if (action === 'stop') {
            await syncService.stop();
            return NextResponse.json({
                success: true,
                message: 'Sync service stopped',
                timestamp: Date.now()
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid action. Use "start" or "stop"',
                    timestamp: Date.now()
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('❌ Sync control error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
            },
            { status: 500 }
        );
    }
}
