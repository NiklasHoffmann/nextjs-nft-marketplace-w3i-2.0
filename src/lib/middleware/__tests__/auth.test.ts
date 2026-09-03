import { describe, it, expect, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

const hasAdminAccessMock = vi.fn();
const isAdminSessionRevokedMock = vi.fn();

vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: hasAdminAccessMock,
}));

vi.mock('@/lib/auth/admin-session-registry', () => ({
  isAdminSessionRevoked: isAdminSessionRevokedMock,
}));

const ADMIN_ADDRESS = '0x1111111111111111111111111111111111111111';
const USER_ADDRESS = '0x2222222222222222222222222222222222222222';
const JWT_SECRET = 'test-secret';

const createRequest = (options?: {
  headers?: Record<string, string>;
  url?: string;
}): NextRequest => {
  const headers = new Headers(options?.headers);
  const url = options?.url ?? 'http://localhost/api/test';
  return {
    headers,
    nextUrl: new URL(url),
    url,
  } as unknown as NextRequest;
};

const loadAuthModule = async () => {
  vi.resetModules();
  hasAdminAccessMock.mockReset();
  isAdminSessionRevokedMock.mockReset();
  hasAdminAccessMock.mockResolvedValue(true);
  isAdminSessionRevokedMock.mockResolvedValue(false);
  process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES = ADMIN_ADDRESS;
  process.env.JWT_SECRET = JWT_SECRET;
  return await import('../auth');
};

const createSignedToken = (payload: Record<string, unknown>) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64url');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
};

describe('auth middleware', () => {
  it('withAuth rejects missing wallet address', async () => {
    const { withAuth } = await loadAuthModule();
    const req = createRequest();

    await expect(withAuth(req)).rejects.toMatchObject({
      name: 'UnauthorizedError',
      statusCode: 401,
    });
  });

  it('withAuth rejects a spoofed wallet header without a session', async () => {
    const { withAuth } = await loadAuthModule();
    const req = createRequest({
      headers: {
        'x-wallet-address': USER_ADDRESS,
      },
      url: `http://localhost/api/test?walletAddress=${USER_ADDRESS}`,
    });

    await expect(withAuth(req)).rejects.toMatchObject({
      name: 'UnauthorizedError',
      statusCode: 401,
    });
    expect(req.userAddress).toBeUndefined();
  });

  it('withAuth sets userAddress from a signed user session cookie', async () => {
    const { withAuth } = await loadAuthModule();
    const token = createSignedToken({
      jti: 'user-jti',
      address: USER_ADDRESS,
      scope: 'user',
      isAdmin: false,
      exp: Date.now() + 60_000,
    });
    const req = createRequest({
      headers: {
        cookie: `user-session=${token}`,
      },
    });

    await withAuth(req);

    expect(req.userAddress).toBe(USER_ADDRESS.toLowerCase());
    expect(req.isAdmin).toBeUndefined();
  });

  it('withAdmin rejects a user-scoped token in the admin cookie', async () => {
    const { withAdmin } = await loadAuthModule();
    const token = createSignedToken({
      jti: 'user-jti',
      address: ADMIN_ADDRESS,
      scope: 'user',
      isAdmin: true,
      exp: Date.now() + 60_000,
    });
    const req = createRequest({
      headers: {
        cookie: `admin-session=${token}`,
      },
    });

    await expect(withAdmin(req)).rejects.toMatchObject({
      name: 'UnauthorizedError',
      statusCode: 401,
    });
  });

  it('withAdmin rejects non-admin session token', async () => {
    const { withAdmin } = await loadAuthModule();
    const token = createSignedToken({
      jti: 'non-admin-jti',
      address: USER_ADDRESS,
      isAdmin: false,
      exp: Date.now() + 60_000,
    });
    const req = createRequest({
      headers: {
        cookie: `admin-session=${token}`,
      },
    });

    await expect(withAdmin(req)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    });
  });

  it('withAdmin requires a session cookie', async () => {
    const { withAdmin } = await loadAuthModule();
    const req = createRequest({
      headers: {
        'x-wallet-address': ADMIN_ADDRESS,
      },
    });

    await expect(withAdmin(req)).rejects.toMatchObject({
      name: 'UnauthorizedError',
      statusCode: 401,
    });
  });

  it('withAdmin rejects invalid session cookie even with admin header', async () => {
    const { withAdmin } = await loadAuthModule();
    const req = createRequest({
      headers: {
        'x-wallet-address': ADMIN_ADDRESS,
        cookie: 'admin-session=invalid',
      },
    });

    await expect(withAdmin(req)).rejects.toMatchObject({
      name: 'UnauthorizedError',
      statusCode: 401,
    });
  });

  it('withAdmin authorizes admin with valid signed session cookie', async () => {
    const { withAdmin } = await loadAuthModule();
    const token = createSignedToken({
      jti: 'valid-admin-jti',
      address: ADMIN_ADDRESS,
      isAdmin: true,
      exp: Date.now() + 60_000,
    });
    const req = createRequest({
      headers: {
        cookie: `admin-session=${token}`,
      },
    });

    await withAdmin(req);

    expect(req.userAddress).toBe(ADMIN_ADDRESS.toLowerCase());
    expect(req.isAdmin).toBe(true);
  });

  it('withAdmin rejects expired signed session cookie', async () => {
    const { withAdmin } = await loadAuthModule();
    const token = createSignedToken({
      jti: 'expired-admin-jti',
      address: ADMIN_ADDRESS,
      isAdmin: true,
      exp: Date.now() - 1_000,
    });
    const req = createRequest({
      headers: {
        cookie: `admin-session=${token}`,
      },
    });

    await expect(withAdmin(req)).rejects.toMatchObject({
      name: 'UnauthorizedError',
      statusCode: 401,
    });
  });

  it('withAdmin rejects invalid signed session cookie', async () => {
    const { withAdmin } = await loadAuthModule();
    const token = createSignedToken({
      jti: 'tampered-admin-jti',
      address: ADMIN_ADDRESS,
      isAdmin: true,
      exp: Date.now() + 60_000,
    });
    const req = createRequest({
      headers: {
        cookie: `admin-session=${token}tampered`,
      },
    });

    await expect(withAdmin(req)).rejects.toMatchObject({
      name: 'UnauthorizedError',
      statusCode: 401,
    });
  });
});
