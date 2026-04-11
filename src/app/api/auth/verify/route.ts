import { NextResponse } from 'next/server';
import { verifyMagicLink, createSession, getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const next = searchParams.get('next');
    const safeNext =
      next && next.startsWith('/') && !next.startsWith('//') ? next : null;

    if (!token) {
      return NextResponse.redirect(
        new URL('/account/login?error=missing_token', request.url)
      );
    }

    // Verify the magic link
    const result = await verifyMagicLink(token);

    if (!result) {
      const session = await getSession();

      if (session) {
        const fallbackPath = session.type === 'admin' ? '/admin' : '/account';
        return NextResponse.redirect(
          new URL(safeNext || fallbackPath, request.url)
        );
      }

      return NextResponse.redirect(
        new URL('/account/login?error=invalid_token', request.url)
      );
    }

    // Create session with type
    await createSession(result.id, result.type);

    // Redirect based on user type
    if (result.type === 'admin') {
      return NextResponse.redirect(new URL(safeNext || '/admin', request.url));
    } else {
      return NextResponse.redirect(new URL(safeNext || '/account', request.url));
    }
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return NextResponse.redirect(
      new URL('/account/login?error=verification_failed', request.url)
    );
  }
}
