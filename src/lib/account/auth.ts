import { UserSession } from './types';
import { getCustomerByEmail, customers } from './mock-data';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'gg_authToken',
  USER_ID: 'gg_userId',
  USER_NAME: 'gg_userName',
  USER_EMAIL: 'gg_userEmail',
  PENDING_EMAIL: 'gg_pendingEmail',
} as const;

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const userId = sessionStorage.getItem(STORAGE_KEYS.USER_ID);
  const name = sessionStorage.getItem(STORAGE_KEYS.USER_NAME);
  const email = sessionStorage.getItem(STORAGE_KEYS.USER_EMAIL);

  if (!token || !userId || !name || !email) {
    return null;
  }

  return { userId, name, email };
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function setPendingEmail(email: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
}

export function getPendingEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
}

export function clearPendingEmail(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
}

export function handleAuthCallback(token: string, email: string): boolean {
  if (typeof window === 'undefined') return false;

  // Try to find the customer by email
  let customer = getCustomerByEmail(email);

  // For demo: if no customer found, default to first customer
  if (!customer) {
    customer = customers[0];
  }

  if (customer) {
    sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEYS.USER_ID, customer.id);
    sessionStorage.setItem(STORAGE_KEYS.USER_NAME, customer.name);
    sessionStorage.setItem(STORAGE_KEYS.USER_EMAIL, customer.email);
    clearPendingEmail();
    return true;
  }

  return false;
}

export function logout(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER_ID);
  sessionStorage.removeItem(STORAGE_KEYS.USER_NAME);
  sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  sessionStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
}

// Demo helper: Generate a mock magic link URL
export function generateMockMagicLink(email: string): string {
  const token = 'mock_' + Math.random().toString(36).substring(2, 15);
  return `/account/auth-callback?token=${token}&email=${encodeURIComponent(email)}`;
}

// Demo helper: Get demo login link for a specific customer
export function getDemoLoginLink(customerId: string = 'c1'): string {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return '/account/login';
  return generateMockMagicLink(customer.email);
}
