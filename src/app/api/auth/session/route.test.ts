import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const cookiesMock = vi.fn();
const cookieGetMock = vi.fn();

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
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

const loadRoute = async (token?: string) => {
  vi.resetModules();
  process.env.JWT_SECRET = 'test-secret';
  cookiesMock.mockReset();
  cookieGetMock.mockReset();
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
    const response = await GET({} as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ isAuthenticated: false });
  });

  it('returns unauthenticated for invalid token', async () => {
    const token = createToken({ address: '0xabc', isAdmin: true, exp: Date.now() + 1000 }, 'wrong-secret');
    const { GET } = await loadRoute(token);
    const response = await GET({} as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ isAuthenticated: false });
  });

  it('returns unauthenticated for non-admin token', async () => {
    const token = createToken({ address: '0xabc', isAdmin: false, exp: Date.now() + 1000 }, 'test-secret');
    const { GET } = await loadRoute(token);
    const response = await GET({} as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ isAuthenticated: false });
  });

  it('returns authenticated for valid admin token', async () => {
    const expiresAt = Date.now() + 1000;
    const token = createToken({ address: '0xabc', isAdmin: true, exp: expiresAt }, 'test-secret');
    const { GET } = await loadRoute(token);
    const response = await GET({} as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      isAuthenticated: true,
      address: '0xabc',
      isAdmin: true,
      expiresAt,
    });
  });
});
