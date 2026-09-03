import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const cookiesMock = vi.fn();
const cookieGetMock = vi.fn();
const hasAdminAccessMock = vi.fn();
const isAdminSessionRevokedMock = vi.fn();

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: hasAdminAccessMock,
}));

vi.mock('@/lib/auth/admin-session-registry', () => ({
  isAdminSessionRevoked: isAdminSessionRevokedMock,
}));

const createToken = (payload: Record<string, unknown>, secret: string): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
};

const createRequest = (): NextRequest => {
  return {
    method: 'GET',
    headers: new Headers(),
    nextUrl: new URL('http://localhost/api/auth/session'),
  } as unknown as NextRequest;
};

const loadRoute = async (token?: string) => {
  vi.resetModules();
  process.env.JWT_SECRET = 'test-secret';
  cookiesMock.mockReset();
  cookieGetMock.mockReset();
  hasAdminAccessMock.mockReset();
  isAdminSessionRevokedMock.mockReset();

  hasAdminAccessMock.mockResolvedValue(true);
  isAdminSessionRevokedMock.mockResolvedValue(false);

  cookiesMock.mockResolvedValue({ get: cookieGetMock });
  cookieGetMock.mockReturnValue(token ? { value: token } : undefined);

  return await import('./route');
};

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('returns unauthenticated when no cookie', async () => {
    const { GET } = await loadRoute();
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ isAuthenticated: false });
  });

  it('returns unauthenticated for invalid token', async () => {
    const token = createToken({ jti: 'invalid-jti', address: '0xabc', isAdmin: true, exp: Date.now() + 1000 }, 'wrong-secret');
    const { GET } = await loadRoute(token);
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ isAuthenticated: false });
  });

  it('returns unauthenticated for non-admin token', async () => {
    const token = createToken({ jti: 'non-admin-jti', address: '0xabc', isAdmin: false, exp: Date.now() + 1000 }, 'test-secret');
    const { GET } = await loadRoute(token);
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ isAuthenticated: false });
  });

  it('returns authenticated for valid admin token', async () => {
    const jti = 'valid-admin-jti';
    const expiresAt = Date.now() + 1000;
    const token = createToken({ jti, address: '0xabc', isAdmin: true, exp: expiresAt }, 'test-secret');
    const { GET } = await loadRoute(token);
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      isAuthenticated: true,
      scope: 'admin',
      jti,
      address: '0xabc',
      isAdmin: true,
      expiresAt,
    });
  });
});
