/**
 * Shared formatting utilities for both account and admin dashboards.
 *
 * This module consolidates formatting functions that were previously
 * duplicated between lib/account/utils.ts and lib/admin-utils.ts.
 *
 * Both modules remain intact for backward compatibility — this module
 * provides a single import point for new code.
 */

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateInput: string | Date | null): string {
  if (!dateInput) return "N/A";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "PENDING":
    case "OFFER_SENT":
    case "SENT":
      return "pending";
    case "KIT_SENT":
    case "LABEL_CREATED":
      return "purple";
    case "IN_TRANSIT":
    case "RECEIVED":
    case "EVALUATING":
    case "PROCESSING":
    case "CREATED":
      return "in-progress";
    case "ACCEPTED":
    case "PAID":
    case "COMPLETED":
    case "DELIVERED":
      return "success";
    case "DECLINED":
    case "CANCELLED":
    case "FAILED":
    case "EXCEPTION":
      return "error";
    case "RETURNED":
    case "DRAFT":
    case "EXPIRED":
    case "VOIDED":
    default:
      return "gray";
  }
}

export function getRelativeTime(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateInput);
}

/** Format payment method enum to display label */
export function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    CHECK: "Check",
    ACH: "Bank Transfer",
    ZELLE: "Zelle",
    PAYPAL: "PayPal",
    VENMO: "Venmo",
  };
  return labels[method] || formatStatus(method);
}
