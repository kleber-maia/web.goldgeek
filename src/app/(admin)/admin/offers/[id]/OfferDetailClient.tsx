"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate, formatStatus, formatDescription, getStatusBadgeClass } from "@/lib/admin-utils";
import { sendOffer } from "@/lib/actions/admin/offer.actions";

interface OfferDetail {
  id: string;
  offerNumber: string;
  status: string;
  totalValue: { toString(): string };
  itemBreakdown: unknown;
  notes: string | null;
  expiresAt: Date | string;
  sentAt: Date | string | null;
  respondedAt: Date | string | null;
  createdAt: Date | string;
  kit: {
    id: string;
    kitNumber: string;
    status: string;
    items: Array<{
      id: string;
      description: string;
      metalType: string | null;
      weight: { toString(): string } | null;
      purity: string | null;
      finalValue: { toString(): string } | null;
      estimatedValue: { toString(): string } | null;
    }>;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
    timeline: Array<{
      id: string;
      title: string;
      description: string | null;
      createdAt: Date | string;
    }>;
  };
  payment: {
    id: string;
    paymentNumber: string;
    amount: { toString(): string };
    method: string;
    status: string;
  } | null;
}

function getStatusBannerStyle(status: string) {
  switch (status.toUpperCase()) {
    case "DRAFT":
      return {
        background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
        labelColor: "#4B5563",
        amountColor: "#1F2937",
        subColor: "#6B7280",
        label: "Draft",
      };
    case "SENT":
      return {
        background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
        labelColor: "#92400E",
        amountColor: "#92400E",
        subColor: "#B45309",
        label: "Pending Response",
      };
    case "ACCEPTED":
      return {
        background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
        labelColor: "#065F46",
        amountColor: "#065F46",
        subColor: "#047857",
        label: "Accepted",
      };
    case "DECLINED":
      return {
        background: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
        labelColor: "#991B1B",
        amountColor: "#991B1B",
        subColor: "#DC2626",
        label: "Declined",
      };
    case "EXPIRED":
      return {
        background: "linear-gradient(135deg, #F3F4F6 0%, #D1D5DB 100%)",
        labelColor: "#4B5563",
        amountColor: "#6B7280",
        subColor: "#9CA3AF",
        label: "Expired",
      };
    default:
      return {
        background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
        labelColor: "#92400E",
        amountColor: "#92400E",
        subColor: "#B45309",
        label: formatStatus(status),
      };
  }
}

export default function OfferDetailClient({
  offer,
}: {
  offer: OfferDetail;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const totalValue = parseFloat(offer.totalValue.toString());
  const initials = `${offer.kit.customer.firstName.charAt(0)}${offer.kit.customer.lastName.charAt(0)}`;
  const bannerStyle = getStatusBannerStyle(offer.status);

  const showFeedback = (type: "error" | "success", message: string) => {
    setFeedback({ type, message });
    if (type === "success") {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSendOffer = async () => {
    if (!confirm("Send this offer to the customer?")) return;

    setIsSubmitting(true);
    try {
      const result = await sendOffer(offer.id);
      if (result.success) {
        showFeedback("success", "Offer sent to customer!");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to send offer");
      }
    } catch (error) {
      console.error("Error sending offer:", error);
      showFeedback("error", "Failed to send offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOffer = async () => {
    if (!confirm("Resend this offer to the customer?")) return;

    setIsSubmitting(true);
    try {
      const result = await sendOffer(offer.id);
      if (result.success) {
        showFeedback("success", "Offer resent to customer!");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to resend offer");
      }
    } catch (error) {
      console.error("Error resending offer:", error);
      showFeedback("error", "Failed to resend offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main" style={{ paddingBottom: "100px" }}>
        {feedback && (
          <div
            style={{
              padding: "12px 16px",
              background: feedback.type === "success" ? "#D1FAE5" : "#FEE2E2",
              color: feedback.type === "success" ? "#065F46" : "#991B1B",
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
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 700, marginLeft: "8px" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="admin-detail-header">
          <Link href="/admin/offers" className="admin-back-btn">
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
            <h1 className="admin-detail-title">{offer.offerNumber}</h1>
            <span
              className={`admin-badge ${getStatusBadgeClass(offer.status)}`}
              style={{ marginTop: "4px" }}
            >
              {formatStatus(offer.status)}
            </span>
          </div>
        </div>

        {/* Offer Status Banner */}
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
            {formatCurrency(totalValue)}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: bannerStyle.subColor,
              marginTop: "8px",
            }}
          >
            {offer.status === "SENT" && `Expires ${formatDate(offer.expiresAt)}`}
            {offer.status === "DRAFT" && "Not yet sent"}
            {offer.status === "ACCEPTED" &&
              `Accepted on ${formatDate(offer.respondedAt)}`}
            {offer.status === "DECLINED" &&
              `Declined on ${formatDate(offer.respondedAt)}`}
            {offer.status === "EXPIRED" &&
              `Expired on ${formatDate(offer.expiresAt)}`}
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
                {offer.kit.customer.firstName} {offer.kit.customer.lastName}
              </div>
              <div style={{ fontSize: "13px", color: "#6B7280" }}>
                {offer.kit.customer.email}
              </div>
            </div>
            <Link
              href={`/admin/customers/${offer.kit.customer.id}`}
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

        {/* Item Breakdown */}
        <div className="admin-section">
          <div className="admin-section-title">
            Items ({offer.kit.items.length})
          </div>

          <div className="admin-items-list" style={{ marginTop: "12px" }}>
            {offer.kit.items.map((item) => {
              const itemValue = parseFloat(
                item.finalValue?.toString() ||
                  item.estimatedValue?.toString() ||
                  "0"
              );
              return (
                <div key={item.id} className="admin-item-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    <div>
                      <div className="admin-item-name">{item.description}</div>
                      <div className="admin-item-meta">
                        {item.weight && `${parseFloat(item.weight.toString())}g`}
                        {item.weight && item.purity && " \u2022 "}
                        {item.purity}
                      </div>
                    </div>
                    <div className="admin-item-value">
                      {formatCurrency(itemValue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="admin-total-bar">
            <span className="admin-total-label">Total Offer</span>
            <span className="admin-total-value">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        {/* Payment Info (if exists) */}
        {offer.payment && (
          <div className="admin-section">
            <div className="admin-section-title">Payment</div>
            <div className="admin-info-grid" style={{ marginTop: "12px" }}>
              <div>
                <div className="admin-info-label">Payment ID</div>
                <div className="admin-info-value">
                  {offer.payment.paymentNumber}
                </div>
              </div>
              <div>
                <div className="admin-info-label">Amount</div>
                <div className="admin-info-value">
                  {formatCurrency(
                    parseFloat(offer.payment.amount.toString())
                  )}
                </div>
              </div>
              <div>
                <div className="admin-info-label">Method</div>
                <div className="admin-info-value">{offer.payment.method}</div>
              </div>
              <div>
                <div className="admin-info-label">Status</div>
                <div className="admin-info-value">
                  {formatStatus(offer.payment.status)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="admin-section">
          <div className="admin-section-title">Timeline</div>
          <div className="admin-timeline" style={{ marginTop: "12px" }}>
            {offer.kit.timeline.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#6B7280",
                }}
              >
                No timeline events
              </div>
            ) : (
              offer.kit.timeline.map((event) => (
                <div key={event.id} className="admin-timeline-item">
                  <div className="admin-timeline-dot"></div>
                  <div className="admin-timeline-content">
                    <div className="admin-timeline-title">{event.title}</div>
                    {event.description && (
                      <div className="admin-timeline-desc">
                        {formatDescription(event.description)}
                      </div>
                    )}
                    <div className="admin-timeline-date">
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
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
          {offer.status === "DRAFT" && (
            <button
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, minWidth: "140px" }}
              onClick={handleSendOffer}
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
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
              {isSubmitting ? "Sending..." : "Send Offer"}
            </button>
          )}
          {offer.status === "SENT" && (
            <button
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, minWidth: "140px" }}
              onClick={handleResendOffer}
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
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              {isSubmitting ? "Resending..." : "Resend Offer"}
            </button>
          )}
          <Link
            href={`/admin/requests/${offer.kit.id}`}
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
            View Request {offer.kit.kitNumber}
          </Link>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
