/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js on server startup
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    const { default: Sentry } = await import('@sentry/nextjs');
    const isNodeRuntime = process.env.NEXT_RUNTIME === 'nodejs';
    const isDev = process.env.NODE_ENV === 'development';

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
        enabled: Boolean(process.env.SENTRY_DSN),
    });

    // Only run on server-side (Node.js runtime)
    if (isNodeRuntime) {
        if (isDev) {
            const globalAny = globalThis as { __uncaughtHandlersRegistered?: boolean };
            if (!globalAny.__uncaughtHandlersRegistered) {
                globalAny.__uncaughtHandlersRegistered = true;

                process.on('uncaughtException', (error: unknown) => {
                    console.error('⛔ [uncaughtException]', error);
                    if (error && typeof error === 'object') {
                        const err = error as { message?: string; stack?: string; code?: string; requireStack?: string[] };
                        console.error('⛔ [uncaughtException] message:', err.message || '(none)');
                        console.error('⛔ [uncaughtException] code:', err.code || '(none)');
                        console.error('⛔ [uncaughtException] requireStack:', err.requireStack || []);
                        console.error('⛔ [uncaughtException] stack:', err.stack || '(none)');
                    }
                });

                process.on('unhandledRejection', (reason: unknown) => {
                    console.error('⛔ [unhandledRejection]', reason);
                    if (reason && typeof reason === 'object') {
                        const err = reason as { message?: string; stack?: string; code?: string; requireStack?: string[] };
                        console.error('⛔ [unhandledRejection] message:', err.message || '(none)');
                        console.error('⛔ [unhandledRejection] code:', err.code || '(none)');
                        console.error('⛔ [unhandledRejection] requireStack:', err.requireStack || []);
                        console.error('⛔ [unhandledRejection] stack:', err.stack || '(none)');
                    }
                });
            }
        }

        console.log('\n🔧 [Instrumentation] Starting background services...');

        try {
            // Import and initialize background services
            const { initializeBackgroundServices } = await import('./src/lib/init-services');
            await initializeBackgroundServices({ waitForReady: false });

            console.log('✅ [Instrumentation] Background services startup triggered\n');
        } catch (error) {
            console.error('❌ [Instrumentation] Failed to start background services:', error);
        }
    }
}
