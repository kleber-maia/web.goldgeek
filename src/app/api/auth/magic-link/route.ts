import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
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
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${result.token}`;

    // TODO: Send email with magic link
    console.log('Magic link URL:', magicLinkUrl);
    console.log('Auth type:', result.type);

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
