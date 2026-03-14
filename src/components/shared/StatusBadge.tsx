/**
 * Shared StatusBadge component for both account and admin dashboards.
 *
 * Usage with account CSS: <StatusBadge status="PENDING" prefix="account" />
 * Usage with admin CSS:   <StatusBadge status="PENDING" prefix="admin" />
 */

interface StatusBadgeProps {
  status: string;
  prefix?: "account" | "admin";
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

const STATUS_LABELS: Record<string, string> = {
  // Kit statuses
  PENDING: "Pending",
  KIT_SENT: "Kit Sent",
  IN_TRANSIT: "In Transit",
  RECEIVED: "Received",
  EVALUATING: "Evaluating",
  OFFER_SENT: "Offer Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  PAID: "Paid",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
  // Offer statuses
  DRAFT: "Draft",
  SENT: "Sent",
  EXPIRED: "Expired",
  // Payment statuses
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  // Shipping
  LABEL_CREATED: "Label Created",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
  VOIDED: "Voided",
  CREATED: "Created",
};

export function getSharedStatusBadgeClass(status: string): string {
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

export function formatStatusLabel(status: string): string {
  const upper = status.toUpperCase();
  return STATUS_LABELS[upper] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({
  status,
  prefix = "account",
  className = "",
  style,
  label,
}: StatusBadgeProps) {
  const badgeClass = getSharedStatusBadgeClass(status);
  const displayLabel = label || formatStatusLabel(status);

  return (
    <span
      className={`${prefix}-badge ${badgeClass} ${className}`}
      style={style}
    >
      {displayLabel}
    </span>
  );
}
