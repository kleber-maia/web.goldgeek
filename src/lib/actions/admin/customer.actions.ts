'use server';
import { requireAdmin } from '@/lib/auth';
import * as AdminCustomerService from '@/lib/services/admin-customer.service';
export type { ActionResult } from '@/lib/services/admin-customer.service';

export async function getAllCustomers() {
  await requireAdmin();
  return AdminCustomerService.getAllCustomers();
}

export async function getCustomerById(customerId: string) {
  await requireAdmin();
  return AdminCustomerService.getCustomerById(customerId);
}

export async function updateCustomerProfile(customerId: string, data: { firstName: string; lastName: string; email: string; phone?: string }) {
  await requireAdmin();
  return AdminCustomerService.updateCustomerProfile(customerId, data);
}

export async function updateCustomerAddress(customerId: string, data: { street1: string; street2?: string; city: string; state: string; zipCode: string }) {
  await requireAdmin();
  return AdminCustomerService.updateCustomerAddress(customerId, data);
}
