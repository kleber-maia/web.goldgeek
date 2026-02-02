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

    // Create magic link
    const token = await createMagicLink(email);

    // In production, send this via email
    // For now, we'll return it in the response for testing
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

    // TODO: Send email with magic link
    console.log('Magic link URL:', magicLinkUrl);

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV === 'development' && { magicLinkUrl }),
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
