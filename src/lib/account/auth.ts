const STORAGE_KEYS = { PENDING_EMAIL: 'gg_pendingEmail', PENDING_MAGIC_LINK: 'gg_pendingMagicLink' } as const;

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

export function setPendingMagicLink(url: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEYS.PENDING_MAGIC_LINK, url);
}

export function getPendingMagicLink(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEYS.PENDING_MAGIC_LINK);
}

export function clearPendingMagicLink(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEYS.PENDING_MAGIC_LINK);
}
