'use server';

import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers(): Promise<ActionResult> {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get admin users';
    console.error('Error getting admin users:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create a new admin user
 */
export async function createAdminUser(email: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const normalizedEmail = email.toLowerCase().trim();

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: 'Admin user with this email already exists' };
    }

    // Check if email belongs to a customer (prevent overlap)
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingCustomer) {
      return {
        success: false,
        error: 'This email is registered as a customer. Please use a different email.',
      };
    }

    const user = await prisma.user.create({
      data: { email: normalizedEmail },
    });

    return {
      success: true,
      data: user,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create admin user';
    console.error('Error creating admin user:', error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete an admin user
 */
export async function deleteAdminUser(userId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();

    // Prevent self-deletion
    if (session.id === userId) {
      return { success: false, error: 'You cannot delete your own admin account' };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'Admin user not found' };
    }

    // Count total admins to prevent deleting last admin
    const adminCount = await prisma.user.count();
    if (adminCount <= 1) {
      return { success: false, error: 'Cannot delete the last admin user' };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete admin user';
    console.error('Error deleting admin user:', error);
    return {
      success: false,
      error: message,
    };
  }
}
