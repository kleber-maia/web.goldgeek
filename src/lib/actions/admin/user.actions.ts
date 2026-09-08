'use server';
import { requireAdmin } from '@/lib/auth';
import * as AdminUserService from '@/lib/services/admin-user.service';
export type { ActionResult } from '@/lib/services/admin-user.service';

export async function getAllAdminUsers() {
  await requireAdmin();
  return AdminUserService.getAllAdminUsers();
}

export async function createAdminUser(email: string) {
  await requireAdmin();
  return AdminUserService.createAdminUser(email);
}

export async function deleteAdminUser(userId: string) {
  const session = await requireAdmin();
  return AdminUserService.deleteAdminUser(userId, session.id);
}
