import { prisma } from '@/lib/db';
import { generateToken, calculateMagicLinkExpiration } from '@/lib/db/utils';
import { UserRole } from '@prisma/client';

/**
 * Creates a magic link token for a user (creates user if doesn't exist)
 */
export async function createMagicLink(email: string): Promise<string> {
  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        role: UserRole.CUSTOMER,
      },
    });
  }

  // Generate token
  const token = generateToken();
  const expiresAt = calculateMagicLinkExpiration();

  // Create magic link
  await prisma.magicLink.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Verifies a magic link token and returns the user ID
 */
export async function verifyMagicLink(token: string): Promise<string | null> {
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!magicLink) {
    return null;
  }

  // Check if already used
  if (magicLink.usedAt) {
    return null;
  }

  // Check if expired
  if (new Date() > magicLink.expiresAt) {
    return null;
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  return magicLink.userId;
}

/**
 * Cleans up expired magic links (should be run periodically)
 */
export async function cleanupExpiredMagicLinks(): Promise<number> {
  const result = await prisma.magicLink.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
