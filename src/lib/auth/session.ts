import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { AuthType } from './magic-link';

const SESSION_COOKIE_NAME = 'gg-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface Session {
  id: string;
  email: string;
  type: AuthType;
}

interface SessionData {
  id: string;
  type: AuthType;
}

/**
 * Creates a new session for a user or customer
 */
export async function createSession(id: string, type: AuthType): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: SessionData = { id, type };

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

/**
 * Gets the current session
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const { id, type } = JSON.parse(sessionCookie.value) as SessionData;

    if (type === 'admin') {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true },
      });

      if (!user) {
        // User no longer exists - return null (can't modify cookies in Server Component)
        return null;
      }

      return { id: user.id, email: user.email, type: 'admin' };
    } else {
      const customer = await prisma.customer.findUnique({
        where: { id },
        select: { id: true, email: true },
      });

      if (!customer) {
        // Customer no longer exists - return null (can't modify cookies in Server Component)
        return null;
      }

      return { id: customer.id, email: customer.email, type: 'customer' };
    }
  } catch {
    // Invalid session data - try legacy format (just userId string)
    const userId = sessionCookie.value;

    // Check if it's a legacy admin session
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (user) {
      // Return session without upgrading (can't modify cookies in Server Component)
      return { id: user.id, email: user.email, type: 'admin' };
    }

    // Check if it's a legacy customer session
    const customer = await prisma.customer.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (customer) {
      return { id: customer.id, email: customer.email, type: 'customer' };
    }

    // Invalid session - return null (don't call destroySession here either)
    return null;
  }
}

/**
 * Gets the current admin user
 */
export async function getAdminUser() {
  const session = await getSession();

  if (!session || session.type !== 'admin') {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.id },
  });
}

/**
 * Gets the current customer with relations
 */
export async function getCurrentCustomer() {
  const session = await getSession();

  if (!session || session.type !== 'customer') {
    return null;
  }

  return prisma.customer.findUnique({
    where: { id: session.id },
    include: {
      addresses: true,
    },
  });
}

/**
 * Destroys the current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Checks if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Checks if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.type === 'admin';
}

/**
 * Requires authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Requires admin role - throws if not admin
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();

  if (!session || session.type !== 'admin') {
    throw new Error('Forbidden');
  }

  return session;
}

/**
 * Requires customer role - throws if not customer
 */
export async function requireCustomer(): Promise<Session> {
  const session = await getSession();

  if (!session || session.type !== 'customer') {
    throw new Error('Forbidden');
  }

  return session;
}
