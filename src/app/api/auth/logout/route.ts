import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { cookies } from 'next/headers';
import { getAdminSessionCookieOptions, verifyAdminSessionToken } from '@/lib/auth/admin-session';
import { revokeAdminSessionByJti } from '@/lib/auth/admin-session-registry';

/**
 * POST /api/auth/logout
 * Löscht die Admin-Session
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-session')?.value;

    if (token) {
        const payload = verifyAdminSessionToken(token);
        if (payload?.jti) {
            await revokeAdminSessionByJti(payload.jti, payload.address);
        }
    }

    cookieStore.set('admin-session', '', getAdminSessionCookieOptions(0));

    return apiSuccess({
        message: 'Logged out successfully'
    });
});
