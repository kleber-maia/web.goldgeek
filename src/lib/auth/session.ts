import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';

const SESSION_COOKIE_NAME = 'gg-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface Session {
  userId: string;
  email: string;
  role: string;
}

/**
 * Creates a new session for a user
 */
export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();

  // Set secure HTTP-only cookie
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
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

  const userId = sessionCookie.value;

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    await destroySession();
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

/**
 * Gets the current user with relations
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      customer: {
        include: {
          addresses: true,
        },
      },
    },
  });

  return user;
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
  return session?.role === 'ADMIN';
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
  const session = await requireAuth();

  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return session;
}
