import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'gg-session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE_NAME);

  // Protect /account/* routes (except login and auth-callback)
  if (pathname.startsWith('/account')) {
    const isLoginPage = pathname === '/account/login';
    const isAuthCallback = pathname === '/account/auth-callback';

    if (!session && !isLoginPage && !isAuthCallback) {
      // Redirect to login if not authenticated
      const url = new URL('/account/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (session && isLoginPage) {
      // Redirect to account if already authenticated
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  // Protect /admin/* routes
  if (pathname.startsWith('/admin')) {
    const isAdminLoginPage = pathname === '/admin/login';

    if (!session && !isAdminLoginPage) {
      // Redirect to admin login if not authenticated
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (session && isAdminLoginPage) {
      // Redirect to admin dashboard if already authenticated
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Note: Role verification happens server-side in the pages
    // We can't check the user's role in middleware without hitting the database
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
