import { NextResponse } from 'next/server';
import { verifyMagicLink, createSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/account/login?error=missing_token', request.url)
      );
    }

    // Verify the magic link
    const userId = await verifyMagicLink(token);

    if (!userId) {
      return NextResponse.redirect(
        new URL('/account/login?error=invalid_token', request.url)
      );
    }

    // Create session
    await createSession(userId);

    // Redirect to account page
    return NextResponse.redirect(new URL('/account', request.url));
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return NextResponse.redirect(
      new URL('/account/login?error=verification_failed', request.url)
    );
  }
}
