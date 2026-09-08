import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { AuthType } from './magic-link';
import { SessionService, SESSION_DURATION_MS, type SessionIdentity } from '@/lib/services/session.service';

const SESSION_COOKIE_NAME = 'gg-session';

export type Session = SessionIdentity;

/**
 * Creates a new session for a user or customer
 */
export async function createSession(id: string, type: AuthType): Promise<void> {
  const cookieStore = await cookies();
  const session = await SessionService.create(
    id,
    type,
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    expires: session.expiresAt,
    path: '/',
  });
}

/**
 * Gets the current session (cached per request to avoid duplicate DB queries)
 */
export const getSession = cache(_getSession);

async function _getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  // Session reads run in Server Components too; never mutate cookies here.
  return SessionService.getIdentity(cookieStore.get(SESSION_COOKIE_NAME)?.value);
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
  await SessionService.revoke(cookieStore.get(SESSION_COOKIE_NAME)?.value);
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
