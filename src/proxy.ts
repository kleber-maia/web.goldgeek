import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'gg-session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE_NAME);

  // Protect /account/* routes (except login and auth-callback)
  if (pathname.startsWith('/account')) {
    const isLoginPage = pathname === '/account/login';
    const isAuthCallback = pathname === '/account/auth-callback';

    if (!session && !isLoginPage && !isAuthCallback) {
      const url = new URL('/account/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Note: We intentionally do NOT redirect from login → dashboard here.
    // The cookie may exist but the session may be invalid/expired.
    // Page-level auth handles the redirect when the session is valid.
  }

  // Protect /admin/* routes
  if (pathname.startsWith('/admin')) {
    const isAdminLoginPage = pathname === '/admin/login';

    if (!session && !isAdminLoginPage) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Note: We intentionally do NOT redirect from login → dashboard here.
    // The cookie may exist but the session may be invalid/expired.
    // Page-level auth handles the redirect when the session is valid.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
