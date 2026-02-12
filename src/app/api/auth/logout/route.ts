import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * Löscht die Admin-Session
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const cookieStore = await cookies();
    cookieStore.set('admin-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    return apiSuccess({
        message: 'Logged out successfully'
    });
});
