import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    // Create magic link (returns token and type)
    const result = await createMagicLink(email);

    // Build magic link URL
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/api/auth/verify?token=${result.token}`;

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
