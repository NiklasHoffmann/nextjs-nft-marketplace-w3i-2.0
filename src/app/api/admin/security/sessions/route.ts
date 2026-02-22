import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError } from '@/lib/api';
import { verifyAdminSessionToken } from '@/lib/auth/admin-session';
import {
  listAdminSessions,
  revokeAdminSessionByJti,
  revokeAllAdminSessions,
} from '@/lib/auth/admin-session-registry';

type SessionAction = 'revoke-current' | 'revoke-all' | 'revoke-one';

interface SessionActionRequest {
  action: SessionAction;
  jti?: string;
}

function getCurrentSessionPayload(req: NextRequest) {
  const token = req.cookies.get('admin-session')?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export const GET = apiHandler(async () => {
  const sessions = await listAdminSessions(100);
  const now = Date.now();

  const activeSessions = sessions.filter((session) => !session.revokedAt && session.expiresAt > now);

  return apiSuccess({
    total: sessions.length,
    active: activeSessions.length,
    revoked: sessions.filter((session) => !!session.revokedAt).length,
    sessions,
  });
}, { admin: true });

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await parseJsonBody<SessionActionRequest>(request);
  const { action, jti } = body;

  const actorAddress = (request.userAddress as string).toLowerCase();
  const currentPayload = getCurrentSessionPayload(request);

  if (!action) {
    throw new BadRequestError('Action is required');
  }

  if (action === 'revoke-current') {
    if (!currentPayload?.jti) {
      throw new BadRequestError('Current session not found');
    }

    const revoked = await revokeAdminSessionByJti(currentPayload.jti, actorAddress);
    return apiSuccess({ revoked, action, jti: currentPayload.jti });
  }

  if (action === 'revoke-one') {
    if (!jti || typeof jti !== 'string') {
      throw new BadRequestError('jti is required for revoke-one');
    }

    const revoked = await revokeAdminSessionByJti(jti, actorAddress);
    return apiSuccess({ revoked, action, jti });
  }

  if (action === 'revoke-all') {
    const modified = await revokeAllAdminSessions(actorAddress, currentPayload?.jti);
    return apiSuccess({ revoked: modified, action, keptCurrent: Boolean(currentPayload?.jti) });
  }

  throw new BadRequestError('Invalid action');
}, { admin: true });
