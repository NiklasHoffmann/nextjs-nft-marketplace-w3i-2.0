import { apiHandler, apiSuccess } from '@/lib/api';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';
import { getAllRequestCounterSnapshots } from '@/lib/monitoring/request-counter';

export const GET = apiHandler(async () => {
    const counters = getAllRequestCounterSnapshots();

    return apiSuccess({
        counters,
        generatedAt: new Date().toISOString(),
    });
}, {
    admin: true,
    rateLimit: RATE_LIMIT_CONFIG.LENIENT,
});
