"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { formatCurrency } from "@/lib/db/utils";
import { ConfirmDialog } from "@/components/shared";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import {
  updatePaymentStatus,
  updatePaymentTracking,
} from "@/lib/actions/admin/payment.actions";

interface Payment {
  id: string;
  paymentNumber: string;
  amount: any;
  method: string;
  status: string;
  trackingNumber: string | null;
  checkNumber: string | null;
  notes: string | null;
  createdAt: string;
  initiatedAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  offer: {
    id: string;
    offerNumber: string;
    totalValue: any;
    kit: {
      id: string;
      kitNumber: string;
    };
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PROCESSING: "Process",
  SENT: "Mark Sent",
  COMPLETED: "Complete",
};

function getNextStatus(current: string): string | null {
  switch (current) {
    case "PENDING":
      return "PROCESSING";
    case "PROCESSING":
      return "SENT";
    case "SENT":
      return "COMPLETED";
    default:
      return null;
  }
}

function getStatusBannerStyle(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
      return {
        background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
        labelColor: "#92400E",
        amountColor: "#92400E",
        subColor: "#B45309",
        label: "Pending",
      };
    case "PROCESSING":
      return {
        background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
        labelColor: "#1E40AF",
        amountColor: "#1E40AF",
        subColor: "#3B82F6",
        label: "Processing",
      };
    case "SENT":
      return {
        background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
        labelColor: "#5B21B6",
        amountColor: "#5B21B6",
        subColor: "#7C3AED",
        label: "Sent",
      };
    case "COMPLETED":
      return {
        background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
        labelColor: "#065F46",
        amountColor: "#065F46",
        subColor: "#047857",
        label: "Completed",
      };
    default:
      return {
        background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
        labelColor: "#4B5563",
        amountColor: "#1F2937",
        subColor: "#6B7280",
        label: formatStatus(status),
      };
  }
}

export default function PaymentDetailClient({
  payment,
}: {
  payment: Payment;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const [trackingNumber, setTrackingNumber] = useState(
    payment.trackingNumber || ""
  );
  const [checkNumber, setCheckNumber] = useState(payment.checkNumber || "");
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  const amount = parseFloat(payment.amount.toString());
  const initials = `${payment.customer.firstName.charAt(0)}${payment.customer.lastName.charAt(0)}`;
  const bannerStyle = getStatusBannerStyle(payment.status);
  const nextStatus = getNextStatus(payment.status);

  const showFeedback = (type: "error" | "success", message: string) => {
    setFeedback({ type, message });
    if (type === "success") {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    setPendingStatus(newStatus);
  };

  const executeUpdateStatus = async () => {
    if (!pendingStatus) return;
    const newStatus = pendingStatus;
    setPendingStatus(null);
    setIsSubmitting(true);
    try {
      const result = await updatePaymentStatus(payment.id, newStatus as any);
      if (result.success) {
        showFeedback("success", `Payment status updated to ${formatStatus(newStatus)}`);
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      showFeedback("error", "Failed to update payment status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingNumber.trim() && !checkNumber.trim()) {
      showFeedback("error", "Please enter a tracking number or check number");
      return;
    }

    setIsSavingTracking(true);
    try {
      const result = await updatePaymentTracking(
        payment.id,
        trackingNumber.trim(),
        checkNumber.trim() || undefined
      );
      if (result.success) {
        showFeedback("success", "Tracking information saved");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to save tracking info");
      }
    } catch (error) {
      console.error("Error saving tracking info:", error);
      showFeedback("error", "Failed to save tracking info");
    } finally {
      setIsSavingTracking(false);
    }
  };

  // Build timeline from status timestamps
  const timelineEntries: Array<{ label: string; date: string | null }> = [
    { label: "Created", date: payment.createdAt },
    { label: "Processing Started", date: payment.initiatedAt },
    { label: "Payment Sent", date: payment.sentAt },
    { label: "Completed", date: payment.completedAt },
  ];

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main" style={{ paddingBottom: "100px" }}>
        {feedback && (
          <div
            style={{
              padding: "12px 16px",
              background:
                feedback.type === "success" ? "#D1FAE5" : "#FEE2E2",
              color:
                feedback.type === "success" ? "#065F46" : "#991B1B",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontWeight: 700,
                marginLeft: "8px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="admin-detail-header">
          <Link href="/admin/payments" className="admin-back-btn">
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </Link>
          <div>
            <h1 className="admin-detail-title">{payment.paymentNumber}</h1>
            <span
              className={`admin-badge ${getStatusBadgeClass(payment.status)}`}
              style={{ marginTop: "4px" }}
            >
              {formatStatus(payment.status)}
            </span>
          </div>
        </div>

        {/* Payment Status Banner */}
        <div
          style={{
            background: bannerStyle.background,
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: bannerStyle.labelColor,
              marginBottom: "8px",
            }}
          >
            {bannerStyle.label}
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: bannerStyle.amountColor,
            }}
          >
            {formatCurrency(amount)}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: bannerStyle.subColor,
              marginTop: "8px",
            }}
          >
            {formatStatus(payment.method)}
          </div>
        </div>

        {/* Customer Info */}
        <div className="admin-section">
          <div className="admin-section-title">Customer</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#AD7B2A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "#2E1F0C" }}>
                {payment.customer.firstName} {payment.customer.lastName}
              </div>
              <div style={{ fontSize: "13px", color: "#6B7280" }}>
                {payment.customer.email}
              </div>
            </div>
            <Link
              href={`/admin/customers/${payment.customer.id}`}
              style={{
                color: "#AD7B2A",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              View Profile
            </Link>
          </div>
        </div>

        {/* Payment Details */}
        <div className="admin-section">
          <div className="admin-section-title">Payment Details</div>
          <div className="admin-info-grid" style={{ marginTop: "12px" }}>
            <div>
              <div className="admin-info-label">Amount</div>
              <div className="admin-info-value">{formatCurrency(amount)}</div>
            </div>
            <div>
              <div className="admin-info-label">Method</div>
              <div className="admin-info-value">
                {formatStatus(payment.method)}
              </div>
            </div>
            <div>
              <div className="admin-info-label">Status</div>
              <div className="admin-info-value">
                <span
                  className={`admin-badge ${getStatusBadgeClass(payment.status)}`}
                >
                  {formatStatus(payment.status)}
                </span>
              </div>
            </div>
            <div>
              <div className="admin-info-label">Created</div>
              <div className="admin-info-value">
                {formatDate(payment.createdAt)}
              </div>
            </div>
            {payment.trackingNumber && (
              <div>
                <div className="admin-info-label">Tracking #</div>
                <div className="admin-info-value">
                  {payment.trackingNumber}
                </div>
              </div>
            )}
            {payment.checkNumber && (
              <div>
                <div className="admin-info-label">Check #</div>
                <div className="admin-info-value">{payment.checkNumber}</div>
              </div>
            )}
          </div>
          {payment.notes && (
            <div style={{ marginTop: "12px" }}>
              <div className="admin-info-label">Notes</div>
              <div
                className="admin-info-value"
                style={{ marginTop: "4px" }}
              >
                {payment.notes}
              </div>
            </div>
          )}
        </div>

        {/* Linked Offer & Kit */}
        <div className="admin-section">
          <div className="admin-section-title">Linked Offer &amp; Kit</div>
          <div className="admin-info-grid" style={{ marginTop: "12px" }}>
            <div>
              <div className="admin-info-label">Offer</div>
              <div className="admin-info-value">
                <Link
                  href={`/admin/offers/${payment.offer.id}`}
                  style={{
                    color: "#AD7B2A",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {payment.offer.offerNumber}
                </Link>
              </div>
            </div>
            <div>
              <div className="admin-info-label">Offer Value</div>
              <div className="admin-info-value">
                {formatCurrency(
                  parseFloat(payment.offer.totalValue.toString())
                )}
              </div>
            </div>
            <div>
              <div className="admin-info-label">Kit</div>
              <div className="admin-info-value">
                <Link
                  href={`/admin/requests/${payment.offer.kit.id}`}
                  style={{
                    color: "#AD7B2A",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {payment.offer.kit.kitNumber}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking / Check Number Edit */}
        <div className="admin-section">
          <div className="admin-section-title">
            Tracking &amp; Check Information
          </div>
          <div style={{ marginTop: "12px" }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Tracking Number</label>
              <input
                type="text"
                className="admin-form-input"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number..."
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Check Number</label>
              <input
                type="text"
                className="admin-form-input"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="Enter check number..."
              />
            </div>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSaveTracking}
              disabled={isSavingTracking}
              style={{ marginTop: "4px" }}
            >
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              {isSavingTracking ? "Saving..." : "Save Tracking Info"}
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="admin-section">
          <div className="admin-section-title">Status Timeline</div>
          <div className="admin-timeline" style={{ marginTop: "12px" }}>
            {timelineEntries.map((entry, index) => {
              const hasDate = !!entry.date;
              return (
                <div
                  key={index}
                  className="admin-timeline-item"
                  style={{ opacity: hasDate ? 1 : 0.4 }}
                >
                  <div
                    className="admin-timeline-dot"
                    style={{
                      background: hasDate ? "#AD7B2A" : "#D1D5DB",
                    }}
                  ></div>
                  <div className="admin-timeline-content">
                    <div className="admin-timeline-title">{entry.label}</div>
                    <div className="admin-timeline-date">
                      {hasDate ? formatDate(entry.date) : "---"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          {nextStatus && (
            <button
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, minWidth: "140px" }}
              onClick={() => handleUpdateStatus(nextStatus)}
              disabled={isSubmitting}
            >
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.69zM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.69z"
                />
              </svg>
              {isSubmitting
                ? "Updating..."
                : STATUS_LABELS[nextStatus] || `Set ${formatStatus(nextStatus)}`}
            </button>
          )}
          <Link
            href={`/admin/requests/${payment.offer.kit.id}`}
            className="admin-btn admin-btn-secondary"
            style={{
              flex: 1,
              minWidth: "140px",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            <svg
              width="16"
              height="16"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            View Kit {payment.offer.kit.kitNumber}
          </Link>
        </div>
      </main>

      <AdminBottomNav />

      <ConfirmDialog
        isOpen={!!pendingStatus}
        title="Confirm Payment Update"
        message={pendingStatus ? `Are you sure you want to ${(STATUS_LABELS[pendingStatus] || pendingStatus).toLowerCase()} this payment?` : ""}
        confirmLabel={pendingStatus ? STATUS_LABELS[pendingStatus] || "Confirm" : "Confirm"}
        variant="warning"
        onConfirm={executeUpdateStatus}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
