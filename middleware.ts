import { NextRequest, NextResponse } from 'next/server';

function isAdminPage(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminLoginPage(pathname: string): boolean {
  return pathname === '/admin/login' || pathname === '/admin/login/';
}

function isAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin/') || pathname.startsWith('/api/nft/admin/');
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isAdminPage(pathname) && !isAdminApi(pathname)) {
    return NextResponse.next();
  }

  if (isAdminLoginPage(pathname)) {
    return NextResponse.next();
  }

  const hasAdminSession = Boolean(request.cookies.get('admin-session')?.value);

  if (hasAdminSession) {
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
