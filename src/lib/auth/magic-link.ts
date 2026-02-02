import { prisma } from '@/lib/db';
import { generateToken, calculateMagicLinkExpiration } from '@/lib/db/utils';

export type AuthType = 'admin' | 'customer';

export interface MagicLinkResult {
  token: string;
  type: AuthType;
}

export interface VerifyResult {
  id: string;
  type: AuthType;
}

/**
 * Creates a magic link token for authentication.
 * - If email belongs to an admin (User table), creates admin magic link
 * - Otherwise, creates customer magic link (creates customer if doesn't exist)
 */
export async function createMagicLink(email: string): Promise<MagicLinkResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if admin exists
  const admin = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (admin) {
    const token = generateToken();
    const expiresAt = calculateMagicLinkExpiration();

    await prisma.magicLink.create({
      data: {
        userId: admin.id,
        token,
        expiresAt,
      },
    });

    return { token, type: 'admin' };
  }

  // Check/create customer
  let customer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email: normalizedEmail,
        firstName: '',
        lastName: '',
      },
    });
  }

  const token = generateToken();
  const expiresAt = calculateMagicLinkExpiration();

  await prisma.customerMagicLink.create({
    data: {
      customerId: customer.id,
      token,
      expiresAt,
    },
  });

  return { token, type: 'customer' };
}

/**
 * Verifies a magic link token and returns the user/customer ID and type
 */
export async function verifyMagicLink(token: string): Promise<VerifyResult | null> {
  // Check admin magic link first
  const adminLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true },
  });

  if (adminLink && !adminLink.usedAt && new Date() < adminLink.expiresAt) {
    await prisma.magicLink.update({
      where: { id: adminLink.id },
      data: { usedAt: new Date() },
    });
    return { id: adminLink.userId, type: 'admin' };
  }

  // Check customer magic link
  const customerLink = await prisma.customerMagicLink.findUnique({
    where: { token },
    include: { customer: true },
  });

  if (customerLink && !customerLink.usedAt && new Date() < customerLink.expiresAt) {
    await prisma.customerMagicLink.update({
      where: { id: customerLink.id },
      data: { usedAt: new Date() },
    });
    return { id: customerLink.customerId, type: 'customer' };
  }

  return null;
}

/**
 * Cleans up expired magic links (should be run periodically)
 */
export async function cleanupExpiredMagicLinks(): Promise<{ admin: number; customer: number }> {
  const now = new Date();

  const adminResult = await prisma.magicLink.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  const customerResult = await prisma.customerMagicLink.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  return {
    admin: adminResult.count,
    customer: customerResult.count,
  };
}
