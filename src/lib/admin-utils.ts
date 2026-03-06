/**
 * Shared utility functions for admin UI components.
 */

export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_ENUM_PATTERN = /\b(PENDING|KIT_SENT|IN_TRANSIT|RECEIVED|EVALUATING|OFFER_SENT|ACCEPTED|DECLINED|PAID|RETURNED|LABEL_CREATED|DELIVERED|PROCESSING|COMPLETED|SENT|DRAFT|EXPIRED|CANCELLED)\b/g;

export function formatDescription(text: string): string {
  return text.replace(STATUS_ENUM_PATTERN, (match) => formatStatus(match));
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
      return "in-progress";
    case "ACCEPTED":
    case "PAID":
    case "COMPLETED":
    case "DELIVERED":
      return "success";
    case "DECLINED":
    case "CANCELLED":
    case "FAILED":
      return "danger";
    case "RETURNED":
    case "DRAFT":
    case "EXPIRED":
    case "VOIDED":
    default:
      return "gray";
  }
}
