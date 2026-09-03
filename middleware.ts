import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

function base64UrlToUint8Array(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    if (!JWT_SECRET) {
      return false;
    }

    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return false;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValidSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      toArrayBuffer(base64UrlToUint8Array(signature)),
      toArrayBuffer(new TextEncoder().encode(`${header}.${payload}`))
    );

    if (!isValidSignature) {
      return false;
    }

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payload));
    const data = JSON.parse(payloadJson) as { exp?: number; isAdmin?: boolean; address?: string; scope?: string };

    // Tokens issued before scopes existed are admin sessions.
    if (data?.scope && data.scope !== 'admin') {
      return false;
    }

    if (!data?.isAdmin || typeof data.address !== 'string') {
      return false;
    }

    if (typeof data.exp !== 'number' || data.exp < Date.now()) {
      return false;
    }

    return /^0x[a-fA-F0-9]{40}$/.test(data.address);
  } catch {
    return false;
  }
}

function isAdminPage(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminLoginPage(pathname: string): boolean {
  return pathname === '/admin/login' || pathname === '/admin/login/';
}

function isAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin/') || pathname.startsWith('/api/nft/admin/');
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isAdminPage(pathname) && !isAdminApi(pathname)) {
    return NextResponse.next();
  }

  if (isAdminLoginPage(pathname)) {
    return NextResponse.next();
  }

  const adminSessionToken = request.cookies.get('admin-session')?.value;
  const hasValidAdminSession = adminSessionToken
    ? await verifyAdminSessionToken(adminSessionToken)
    : false;

  if (hasValidAdminSession) {
    return NextResponse.next();
  }

  if (isAdminApi(pathname)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin authentication required',
      },
      { status: 401 }
    );
  }

  const redirectUrl = encodeURIComponent(`${pathname}${search}`);
  const loginUrl = new URL(`/admin/login?redirect=${redirectUrl}`, request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/nft/admin/:path*'],
};
