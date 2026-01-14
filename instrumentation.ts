/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js on server startup
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run on server-side (Node.js runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('\n🔧 [Instrumentation] Starting background services...');

        try {
            // Import and initialize background services
            const { initializeBackgroundServices } = await import('./src/lib/init-services');
            await initializeBackgroundServices();

            console.log('✅ [Instrumentation] Background services started\n');
        } catch (error) {
            console.error('❌ [Instrumentation] Failed to start background services:', error);
        }
    }
}
