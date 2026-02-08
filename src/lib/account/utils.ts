import { KitStatus, KitStatusKey, KitType, KitTypeKey, STATUSES } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function normalizeKitStatus(status: KitStatus | string): KitStatusKey {
  const normalized = status.toLowerCase();
  if (normalized === 'cancelled' || normalized === 'canceled') {
    return 'cancelled';
  }
  return normalized as KitStatusKey;
}

export function normalizeKitType(type: KitType | string): KitTypeKey {
  return type.toLowerCase() as KitTypeKey;
}

export function formatStatusForUser(status: KitStatus | string): string {
  const key = normalizeKitStatus(status);
  return STATUSES[key]?.userLabel || status;
}

export function getStatusBadgeClass(status: KitStatus | string): string {
  const key = normalizeKitStatus(status);
  return STATUSES[key]?.badgeClass || 'gray';
}

export function getRelativeTime(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateInput);
}

export function generateKitNumber(idOrNumber: string): string {
  if (!idOrNumber) return '';
  if (idOrNumber.startsWith('GG-')) {
    return idOrNumber;
  }
  return idOrNumber.replace('r', '');
}
