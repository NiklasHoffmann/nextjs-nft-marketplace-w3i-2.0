/**
 * Health Check & Service Initialization Endpoint
 * 
 * This endpoint:
 * 1. Checks if background services are running
 * 2. Auto-starts them if not running (fallback for dev mode)
 * 3. Returns service status
 */

import { NextResponse } from 'next/server';
import { getNFTSyncService } from '@/services/nft-sync';

// Track if services were auto-started
let autoStarted = false;

export async function GET() {
    try {
        const syncService = getNFTSyncService();
        const status = syncService.getStatus();

        // Auto-start services if not running (fallback for dev mode)
        if (!status.isRunning && !autoStarted) {
            console.log('\n🔧 [Health Check] Auto-starting background services...');
            await syncService.start();
            autoStarted = true;
            
            return NextResponse.json({
                status: 'started',
                message: 'Background services auto-started',
                services: syncService.getStatus()
            });
        }

        return NextResponse.json({
            status: status.isRunning ? 'running' : 'stopped',
            services: status
        });
    } catch (error) {
        console.error('❌ [Health Check] Error:', error);
        return NextResponse.json(
            { 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}
