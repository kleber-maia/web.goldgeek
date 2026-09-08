import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import type { AuthType } from '@/lib/auth/magic-link';

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionIdentity {
  id: string;
  email: string;
  type: AuthType;
}

function tokenHash(token: string | undefined): string | null {
  if (!token || !/^v1_[a-f0-9]{64}$/.test(token)) return null;
  return createHash('sha256').update(token).digest('hex');
}

export class SessionService {
  static async create(id: string, type: AuthType, previousToken?: string) {
    if (type !== 'admin' && type !== 'customer') {
      throw new Error('Invalid session type');
    }

    const token = `v1_${randomBytes(32).toString('hex')}`;
    const hash = createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    const previousHash = tokenHash(previousToken);

    await prisma.$transaction(async (tx) => {
      await tx.authSession.create({
        data: {
          tokenHash: hash,
          expiresAt,
          ...(type === 'admin' ? { userId: id } : { customerId: id }),
        },
      });

      // A successful sign-in rotates the browser's previous session, even across roles.
      if (previousHash) {
        await tx.authSession.updateMany({
          where: { tokenHash: previousHash, revokedAt: null },
          data: { revokedAt: now },
        });
      }
    });

    return { token, expiresAt };
  }

  static async getIdentity(token: string | undefined): Promise<SessionIdentity | null> {
    const hash = tokenHash(token);
    if (!hash) return null;

    const session = await prisma.authSession.findFirst({
      where: { tokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        user: { select: { id: true, email: true } },
        customer: { select: { id: true, email: true } },
      },
    });

    if (session?.user && !session.customer) {
      return { ...session.user, type: 'admin' };
    }
    if (session?.customer && !session.user) {
      return { ...session.customer, type: 'customer' };
    }
    return null;
  }

  static async revoke(token: string | undefined): Promise<void> {
    const hash = tokenHash(token);
    if (!hash) return;

    await prisma.authSession.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
