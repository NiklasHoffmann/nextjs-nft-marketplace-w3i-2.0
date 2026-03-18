import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const cookiesSetMock = vi.fn();
const cookiesMock = vi.fn();
const verifyMessageMock = vi.fn();
const hasAdminAccessMock = vi.fn();

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('viem', () => ({
  verifyMessage: verifyMessageMock,
}));

vi.mock('@/lib/auth/admin-access', () => ({
  hasAdminAccess: hasAdminAccessMock,
}));

const createChallengeMessage = (nonce: string, timestamp: number) =>
  `Sign this message to authenticate as admin.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

const createRequest = (body: Record<string, unknown>): NextRequest => {
  return {
    method: 'POST',
    headers: new Headers(),
    nextUrl: new URL('http://localhost/api/auth/verify'),
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

const loadRoute = async () => {
  vi.resetModules();
  process.env.JWT_SECRET = 'test-secret';
  cookiesSetMock.mockReset();
  cookiesMock.mockReset();
  verifyMessageMock.mockReset();
  hasAdminAccessMock.mockReset();
  hasAdminAccessMock.mockResolvedValue(true);
  cookiesMock.mockResolvedValue({ set: cookiesSetMock });

  return await import('./route');
};

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('rejects missing fields', async () => {
    const { POST } = await loadRoute();
    const req = createRequest({});

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Missing required fields');
  });

  it('rejects expired challenges', async () => {
    const { POST } = await loadRoute();
    const nonce = 'a'.repeat(32);
    const timestamp = Date.now() - 10 * 60 * 1000;
    const req = createRequest({
      address: '0x1111111111111111111111111111111111111111',
      signature: '0xabc',
      message: createChallengeMessage(nonce, timestamp),
      nonce,
      timestamp,
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Challenge expired');
  });

  it('rejects invalid signatures', async () => {
    const { POST } = await loadRoute();
    verifyMessageMock.mockResolvedValue(false);
    hasAdminAccessMock.mockResolvedValue(true);
    const nonce = 'b'.repeat(32);
    const timestamp = Date.now();
    const req = createRequest({
      address: '0x1111111111111111111111111111111111111111',
      signature: '0xabc',
      message: createChallengeMessage(nonce, timestamp),
      nonce,
      timestamp,
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid signature');
  });

  it('rejects non-admin addresses', async () => {
    const { POST } = await loadRoute();
    verifyMessageMock.mockResolvedValue(true);
    hasAdminAccessMock.mockResolvedValue(false);
    const nonce = 'c'.repeat(32);
    const timestamp = Date.now();
    const req = createRequest({
      address: '0x2222222222222222222222222222222222222222',
      signature: '0xabc',
      message: createChallengeMessage(nonce, timestamp),
      nonce,
      timestamp,
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Not an admin address');
  });

  it('creates session cookie for valid admin signature', async () => {
    const { POST } = await loadRoute();
    verifyMessageMock.mockResolvedValue(true);
    hasAdminAccessMock.mockResolvedValue(true);
    const nonce = 'd'.repeat(32);
    const timestamp = Date.now();
    const req = createRequest({
      address: '0x1111111111111111111111111111111111111111',
      signature: '0xabc',
      message: createChallengeMessage(nonce, timestamp),
      nonce,
      timestamp,
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      address: '0x1111111111111111111111111111111111111111',
      isAdmin: true,
    });
    expect(cookiesSetMock).toHaveBeenCalledTimes(1);
    expect(cookiesSetMock.mock.calls[0][0]).toBe('admin-session');
    expect(cookiesSetMock.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
  });
});
