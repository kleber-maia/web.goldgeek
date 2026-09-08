import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { z } from 'zod';
import { appRoutes, buildAbsoluteUrl, buildBaseUrlFromRequest, resolveBaseUrl } from '@/lib/url';
import { safeLoginDestination } from '@/lib/auth/redirect';
import { AuthRateLimitService } from '@/lib/services/auth-rate-limit.service';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['customer', 'admin']).default('customer'),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, type, next } = requestSchema.parse(body);
    const identityAllowed = await AuthRateLimitService.allow(`email:${type}:${email.trim().toLowerCase()}`, 5);
    // Vercel supplies this trusted connection header. Local runs share one bucket.
    const remote = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local';
    const remoteAllowed = await AuthRateLimitService.allow(`ip:${remote}`, 20);
    if (!identityAllowed || !remoteAllowed) {
      return NextResponse.json({ success: false, error: 'Too many sign-in requests. Please wait 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
    }

    // Create magic link (returns token and type)
    const result = await createMagicLink(email, type);

    // Build magic link URL
    const baseUrl =
      resolveBaseUrl(
        buildBaseUrlFromRequest(request),
        process.env.NEXT_PUBLIC_APP_URL
      ) || 'http://localhost:3000';
    const magicLinkUrl = buildAbsoluteUrl(baseUrl, appRoutes.authVerify(result.token, safeLoginDestination(next, type)));

    // Send the magic link email
    const emailSent = await sendMagicLinkEmail(email, magicLinkUrl, baseUrl);
    if (!emailSent) {
      console.error('Failed to send magic link email to:', email);
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV === 'development' && {
        magicLinkUrl,
        type: result.type,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Error creating magic link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create magic link' },
      { status: 500 }
    );
  }
}
