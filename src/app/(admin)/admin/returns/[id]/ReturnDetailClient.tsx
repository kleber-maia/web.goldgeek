"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { ConfirmDialog } from "@/components/shared";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import { updateReturnStatus, generateReturnFedExLabel } from "@/lib/actions/admin/shipping.actions";
import { formatCurrency } from "@/lib/db/utils";

interface ReturnData {
  id: string;
  returnNumber: string;
  status: string;
  reason: string | null;
  notes: string | null;
  trackingNumber: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  kit: {
    id: string;
    kitNumber: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    items: Array<{
      id: string;
      description: string;
      itemType: string;
      metalType: string | null;
      weight: any;
      purity: string | null;
      finalValue: any;
    }>;
  };
}

const STATUS_FLOW: Record<string, string> = {
  PENDING: "LABEL_CREATED",
  LABEL_CREATED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

const STATUS_BUTTON_LABELS: Record<string, string> = {
  LABEL_CREATED: "Mark Label Created",
  IN_TRANSIT: "Mark Shipped",
  DELIVERED: "Mark Delivered",
};

function getStatusBannerStyle(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
      return {
        background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
        labelColor: "#92400E",
        subColor: "#B45309",
      };
    case "LABEL_CREATED":
      return {
        background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
        labelColor: "#5B21B6",
        subColor: "#7C3AED",
      };
    case "IN_TRANSIT":
      return {
        background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
        labelColor: "#1E40AF",
        subColor: "#3B82F6",
      };
    case "DELIVERED":
      return {
        background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
        labelColor: "#065F46",
        subColor: "#047857",
      };
    default:
      return {
        background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
        labelColor: "#4B5563",
        subColor: "#6B7280",
      };
  }
}

export default function ReturnDetailClient({
  returnData,
}: {
  returnData: ReturnData;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(returnData.trackingNumber || "");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [confirmType, setConfirmType] = useState<"status" | "label" | null>(null);

  const initials = `${returnData.kit.customer.firstName.charAt(0)}${returnData.kit.customer.lastName.charAt(0)}`;
  const nextStatus = STATUS_FLOW[returnData.status] || null;
  const bannerStyle = getStatusBannerStyle(returnData.status);

  const showFeedback = (type: "error" | "success", message: string) => {
    setFeedback({ type, message });
    if (type === "success") {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleUpdateStatus = () => {
    if (!nextStatus) return;
    setConfirmType("status");
  };

  const executeUpdateStatus = async () => {
    if (!nextStatus) return;
    setConfirmType(null);
    setIsUpdating(true);
    try {
      const result = await updateReturnStatus(returnData.id, nextStatus as any);
      if (result.success) {
        showFeedback("success", `Status updated to ${formatStatus(nextStatus)}`);
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to update status");
      }
    } catch {
      showFeedback("error", "Failed to update return status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateLabel = () => {
    setConfirmType("label");
  };

  const executeGenerateLabel = async () => {
    setConfirmType(null);
    setIsGeneratingLabel(true);
    try {
      const result = await generateReturnFedExLabel(returnData.kit.id);
      if (result.success) {
        showFeedback("success", "Return label generated successfully!");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to generate return label");
      }
    } catch {
      showFeedback("error", "Failed to generate return label");
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main" style={{ paddingBottom: "100px" }}>
        <AdminHeader title="Return Detail" backHref="/admin/returns" />

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
              x
            </button>
          </div>
        )}

        {/* Header */}
        <div className="admin-detail-header">
          <Link href="/admin/returns" className="admin-back-btn">
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
            <h1 className="admin-detail-title">{returnData.returnNumber}</h1>
            <span
              className={`admin-badge ${getStatusBadgeClass(returnData.status)}`}
              style={{ marginTop: "4px" }}
            >
              {formatStatus(returnData.status)}
            </span>
          </div>
        </div>

        {/* Status Banner */}
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
            Return Status
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: bannerStyle.labelColor,
            }}
          >
            {formatStatus(returnData.status)}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: bannerStyle.subColor,
              marginTop: "8px",
            }}
          >
            {returnData.status === "PENDING" && "Awaiting return label"}
            {returnData.status === "LABEL_CREATED" && "Label created, awaiting shipment"}
            {returnData.status === "IN_TRANSIT" &&
              `Shipped on ${formatDate(returnData.shippedAt)}`}
            {returnData.status === "DELIVERED" &&
              `Delivered on ${formatDate(returnData.deliveredAt)}`}
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
                {returnData.kit.customer.firstName} {returnData.kit.customer.lastName}
              </div>
              <div style={{ fontSize: "13px", color: "#6B7280" }}>
                {returnData.kit.customer.email}
              </div>
            </div>
            <Link
              href={`/admin/customers/${returnData.kit.customer.id}`}
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

        {/* Return Details */}
        <div className="admin-section">
          <div className="admin-section-title">Return Details</div>
          <div className="admin-info-grid" style={{ marginTop: "12px" }}>
            <div>
              <div className="admin-info-label">Return Number</div>
              <div className="admin-info-value">{returnData.returnNumber}</div>
            </div>
            <div>
              <div className="admin-info-label">Kit</div>
              <div className="admin-info-value">
                <Link
                  href={`/admin/requests/${returnData.kit.id}`}
                  style={{ color: "#AD7B2A", textDecoration: "none", fontWeight: 500 }}
                >
                  {returnData.kit.kitNumber}
                </Link>
              </div>
            </div>
            <div>
              <div className="admin-info-label">Reason</div>
              <div className="admin-info-value">{returnData.reason || "N/A"}</div>
            </div>
            <div>
              <div className="admin-info-label">Notes</div>
              <div className="admin-info-value">{returnData.notes || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Tracking Number */}
        <div className="admin-section">
          <div className="admin-section-title">Tracking</div>
          <div style={{ marginTop: "12px" }}>
            <label className="admin-form-label" htmlFor="tracking">
              Tracking Number
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                id="tracking"
                type="text"
                className="admin-form-input"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                readOnly={returnData.status === "DELIVERED"}
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  opacity: returnData.status === "DELIVERED" ? 0.7 : 1,
                }}
              />
            </div>
            {trackingNumber && (
              <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
                Current: {trackingNumber}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="admin-section">
          <div className="admin-section-title">
            Items ({returnData.kit.items.length})
          </div>

          <div className="admin-items-list" style={{ marginTop: "12px" }}>
            {returnData.kit.items.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                No items in this kit
              </div>
            ) : (
              returnData.kit.items.map((item) => {
                const itemValue = parseFloat(
                  item.finalValue?.toString() || "0"
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
                          {formatStatus(item.itemType)}
                          {item.metalType && ` \u2022 ${formatStatus(item.metalType)}`}
                          {item.weight && ` \u2022 ${parseFloat(item.weight.toString())}g`}
                          {item.purity && ` \u2022 ${item.purity}`}
                        </div>
                      </div>
                      {itemValue > 0 && (
                        <div className="admin-item-value">
                          {formatCurrency(itemValue)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="admin-section">
          <div className="admin-section-title">Timeline</div>
          <div className="admin-timeline" style={{ marginTop: "12px" }}>
            <div className="admin-timeline-item">
              <div className="admin-timeline-dot"></div>
              <div className="admin-timeline-content">
                <div className="admin-timeline-title">Return Created</div>
                <div className="admin-timeline-date">
                  {formatDate(returnData.createdAt)}
                </div>
              </div>
            </div>

            {returnData.shippedAt && (
              <div className="admin-timeline-item">
                <div className="admin-timeline-dot"></div>
                <div className="admin-timeline-content">
                  <div className="admin-timeline-title">Shipped</div>
                  <div className="admin-timeline-date">
                    {formatDate(returnData.shippedAt)}
                  </div>
                </div>
              </div>
            )}

            {returnData.deliveredAt && (
              <div className="admin-timeline-item">
                <div className="admin-timeline-dot"></div>
                <div className="admin-timeline-content">
                  <div className="admin-timeline-title">Delivered</div>
                  <div className="admin-timeline-date">
                    {formatDate(returnData.deliveredAt)}
                  </div>
                </div>
              </div>
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
          {returnData.status === "PENDING" && (
            <button
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, minWidth: "140px" }}
              onClick={handleGenerateLabel}
              disabled={isGeneratingLabel}
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
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12zm-2.25 0h.008v.008H16.5V12z"
                />
              </svg>
              {isGeneratingLabel ? "Generating..." : "Generate Return Label"}
            </button>
          )}

          {nextStatus && (
            <button
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, minWidth: "140px" }}
              onClick={handleUpdateStatus}
              disabled={isUpdating}
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
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isUpdating
                ? "Updating..."
                : STATUS_BUTTON_LABELS[nextStatus] || `Update to ${formatStatus(nextStatus)}`}
            </button>
          )}

          <Link
            href={`/admin/requests/${returnData.kit.id}`}
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
            View Kit {returnData.kit.kitNumber}
          </Link>
        </div>
      </main>

      <AdminBottomNav />

      <ConfirmDialog
        isOpen={confirmType === "status"}
        title="Update Return Status"
        message={nextStatus ? `${STATUS_BUTTON_LABELS[nextStatus] || `Update to ${formatStatus(nextStatus)}`}?` : ""}
        confirmLabel={nextStatus ? STATUS_BUTTON_LABELS[nextStatus] || "Confirm" : "Confirm"}
        variant="warning"
        onConfirm={executeUpdateStatus}
        onCancel={() => setConfirmType(null)}
      />
      <ConfirmDialog
        isOpen={confirmType === "label"}
        title="Generate Return Label"
        message="Generate a FedEx return label for this kit?"
        confirmLabel="Generate Label"
        onConfirm={executeGenerateLabel}
        onCancel={() => setConfirmType(null)}
      />
    </div>
  );
}
