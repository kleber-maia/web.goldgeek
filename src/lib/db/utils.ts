import { nanoid } from 'nanoid';

/**
 * Generates a unique kit number in format: GG-YYYY-NNNNNN
 */
export function generateKitNumber(): string {
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `GG-${year}-${random}`;
}

/**
 * Generates a unique offer number in format: OFF-YYYY-NNNNNN
 */
export function generateOfferNumber(): string {
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `OFF-${year}-${random}`;
}

/**
 * Generates a unique payment number in format: PAY-YYYY-NNNNNN
 */
export function generatePaymentNumber(): string {
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `PAY-${year}-${random}`;
}

/**
 * Generates a unique return number in format: RET-YYYY-NNNNNN
 */
export function generateReturnNumber(): string {
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `RET-${year}-${random}`;
}

/**
 * Generates a secure random token for magic links
 */
export function generateToken(length: number = 32): string {
  return nanoid(length);
}

/**
 * Calculates offer expiration date (7 days from now)
 */
export function calculateOfferExpiration(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

/**
 * Calculates magic link expiration (15 minutes from now)
 */
export function calculateMagicLinkExpiration(): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 15);
  return date;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Format weight with proper units
 */
export function formatWeight(grams: number | string, unit: 'g' | 'oz' = 'g'): string {
  const num = typeof grams === 'string' ? parseFloat(grams) : grams;
  if (unit === 'oz') {
    const oz = num * 0.03527396; // Convert grams to troy ounces
    return `${oz.toFixed(3)} oz`;
  }
  return `${num.toFixed(3)} g`;
}
