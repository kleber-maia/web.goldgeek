import { NextResponse } from 'next/server';
import { verifyMagicLink, createSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const next = searchParams.get('next');

    if (!token) {
      return NextResponse.redirect(
        new URL('/account/login?error=missing_token', request.url)
      );
    }

    // Verify the magic link
    const result = await verifyMagicLink(token);

    if (!result) {
      return NextResponse.redirect(
        new URL('/account/login?error=invalid_token', request.url)
      );
    }

    // Create session with type
    await createSession(result.id, result.type);

    const safeNext =
      next && next.startsWith('/') && !next.startsWith('//') ? next : null;

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
