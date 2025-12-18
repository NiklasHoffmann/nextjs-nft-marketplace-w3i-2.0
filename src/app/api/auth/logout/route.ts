import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * Löscht die Admin-Session
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const cookieStore = await cookies();
    cookieStore.delete('admin-session');

    return apiSuccess({
        message: 'Logged out successfully'
    });
});
