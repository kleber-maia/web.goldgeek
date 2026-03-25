"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatCurrency } from "@/lib/db/utils";
import { ConfirmDialog } from "@/components/shared";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import { updatePaymentStatus } from "@/lib/actions/admin/payment.actions";

interface Payment {
  id: string;
  paymentNumber: string;
  amount: any;
  method: string;
  status: string;
  createdAt: Date | string;
  sentAt: Date | string | null;
  completedAt: Date | string | null;
  offer: {
    offerNumber: string;
    kit: {
      id: string;
      kitNumber: string;
    };
  };
  customer: {
    firstName: string;
    lastName: string;
  };
}

interface UnpaidOffer {
  id: string;
  offerNumber: string;
  totalValue: any;
  respondedAt: Date | string | null;
  kit: {
    id: string;
    kitNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    };
  };
}

const FILTER_TABS = ["all", "awaiting_payment", "processing", "completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const FILTER_LABELS: Record<FilterTab, string> = {
  all: "All",
  awaiting_payment: "Awaiting Payment",
  processing: "Processing",
  completed: "Completed",
};

// Only tabs where admin must act get a gold badge
const ACTION_TABS = new Set<FilterTab>(["awaiting_payment", "processing"]);

const STATUS_LABELS: Record<string, string> = {
  PROCESSING: "Process",
  SENT: "Mark Sent",
  COMPLETED: "Complete",
};

function getNextStatus(current: string): string | null {
  switch (current) {
    case "PENDING": return "PROCESSING";
    case "PROCESSING": return "SENT";
    case "SENT": return "COMPLETED";
    default: return null;
  }
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: "12px",
        padding: "4px 8px",
        background: disabled ? "#D1C4A9" : "#AD7B2A",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {disabled ? "Updating..." : label}
    </button>
  );
}

export default function PaymentsClient({
  payments,
  unpaidOffers,
}: {
  payments: Payment[];
  unpaidOffers: UnpaidOffer[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: unpaidOffers.length + payments.length,
      awaiting_payment: unpaidOffers.length,
      processing: 0, completed: 0,
    };
    for (const p of payments) {
      if (["PENDING", "PROCESSING"].includes(p.status)) counts.processing++;
      else if (["SENT", "COMPLETED"].includes(p.status)) counts.completed++;
    }
    return counts;
  }, [payments, unpaidOffers]);

  const initialFilter = searchParams.get("status");
  const [activeFilter, setActiveFilter] = useState<FilterTab>(
    initialFilter && FILTER_TABS.includes(initialFilter as FilterTab) ? initialFilter as FilterTab : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const matchesSearch = (name: string, ...fields: string[]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || fields.some((f) => f.toLowerCase().includes(q));
  };

  // Filtered unpaid offers
  const filteredUnpaid = unpaidOffers.filter((offer) => {
    if (activeFilter !== "all" && activeFilter !== "awaiting_payment") return false;
    const name = `${offer.kit.customer.firstName} ${offer.kit.customer.lastName}`;
    return matchesSearch(name, offer.offerNumber, offer.kit.kitNumber);
  });

  // Filtered payments — tabs group statuses, "All" shows everything
  const filteredPayments = payments.filter((payment) => {
    if (activeFilter === "awaiting_payment") return false;
    if (activeFilter === "processing") return ["PENDING", "PROCESSING"].includes(payment.status);
    if (activeFilter === "completed") return ["SENT", "COMPLETED"].includes(payment.status);
    if (activeFilter !== "all") return false;
    const name = `${payment.customer.firstName} ${payment.customer.lastName}`;
    return matchesSearch(name, payment.paymentNumber);
  });

  const handleUpdateStatus = (paymentId: string, newStatus: string) => {
    if (newStatus === "SENT" || newStatus === "COMPLETED") {
      setPendingUpdate({ id: paymentId, status: newStatus });
      return;
    }
    executeUpdateStatus(paymentId, newStatus);
  };

  const executeUpdateStatus = async (paymentId: string, newStatus: string) => {
    setPendingUpdate(null);
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    setUpdatingId(paymentId);
    setErrorMsg("");
    try {
      const result = await updatePaymentStatus(paymentId, newStatus as any);
      if (result.success) {
        setSuccessMsg(`Payment ${statusLabel.toLowerCase()}ed successfully`);
        router.refresh();
      } else {
        setErrorMsg(result.error || "Failed to update status");
      }
    } catch {
      setErrorMsg("Failed to update payment status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Payments" backHref="/admin" />

        {/* Filter Tabs */}
        <div className="admin-filter-tabs">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {FILTER_LABELS[tab]}
                {count > 0 && tab !== "all" && ACTION_TABS.has(tab) && (
                  <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: 600, minWidth: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "9px", padding: "0 5px", background: "#AD7B2A", color: "#FFFFFF" }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="admin-search-wrapper">
          <svg className="admin-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="admin-search"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {successMsg && (
          <div style={{ padding: "12px 16px", background: "#D1FAE5", color: "#065F46", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: "12px 16px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {errorMsg}
          </div>
        )}

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredUnpaid.length === 0 && filteredPayments.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No payments found</div>
              </div>
            </div>
          ) : (
            <>
              {/* Unpaid offer cards */}
              {filteredUnpaid.map((offer) => (
                <Link
                  key={`offer-${offer.id}`}
                  href={`/admin/requests/${offer.kit.id}?from=payments`}
                  className="admin-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-id">{offer.kit.kitNumber}</div>
                      <div className="admin-card-name">
                        {offer.kit.customer.firstName} {offer.kit.customer.lastName}
                      </div>
                    </div>
                    <span className="admin-badge pending" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B" }}>
                      Awaiting Payment
                    </span>
                  </div>
                  <div className="admin-card-meta">
                    {offer.offerNumber} &bull; Accepted {offer.respondedAt ? formatDate(offer.respondedAt) : ""}
                  </div>
                  <div className="admin-card-footer">
                    <span style={{ fontSize: "14px", color: "#AD7B2A", fontWeight: 500 }}>
                      {formatCurrency(parseFloat(offer.totalValue.toString()))}
                    </span>
                    <span style={{ fontSize: "12px", padding: "4px 8px", background: "#AD7B2A", color: "white", borderRadius: "4px", fontWeight: 500 }}>
                      Create Payment
                    </span>
                  </div>
                </Link>
              ))}

              {/* Payment cards */}
              {filteredPayments.map((payment) => {
                const nextStatus = getNextStatus(payment.status);
                const isThisUpdating = updatingId === payment.id;
                return (
                  <Link key={payment.id} href={`/admin/requests/${payment.offer.kit.id}?from=payments`} className="admin-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="admin-card-header">
                      <div>
                        <div className="admin-card-id">{payment.offer.kit.kitNumber}</div>
                        <div className="admin-card-name">
                          {payment.customer.firstName} {payment.customer.lastName}
                        </div>
                      </div>
                      <span className={`admin-badge ${getStatusBadgeClass(payment.status)}`}>
                        {formatStatus(payment.status)}
                      </span>
                    </div>
                    <div className="admin-card-meta">
                      {payment.paymentNumber} &bull; {payment.method} &bull; {formatDate(payment.createdAt)}
                    </div>
                    <div className="admin-card-footer">
                      <span style={{ fontSize: "14px", color: "#AD7B2A", fontWeight: 500 }}>
                        {formatCurrency(parseFloat(payment.amount.toString()))}
                      </span>
                      {nextStatus && (
                        <ActionButton
                          label={STATUS_LABELS[nextStatus]}
                          onClick={() => handleUpdateStatus(payment.id, nextStatus)}
                          disabled={isThisUpdating}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kit</th>
                <th>Payment</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnpaid.length === 0 && filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                    No payments found
                  </td>
                </tr>
              ) : (
                <>
                  {/* Unpaid offer rows */}
                  {filteredUnpaid.map((offer) => (
                    <tr key={`offer-${offer.id}`}>
                      <td>
                        <Link href={`/admin/requests/${offer.kit.id}?from=payments`} className="admin-table-link">
                          {offer.kit.kitNumber}
                        </Link>
                      </td>
                      <td style={{ color: "#6B7280", fontStyle: "italic" }}>—</td>
                      <td>{offer.kit.customer.firstName} {offer.kit.customer.lastName}</td>
                      <td>{formatCurrency(parseFloat(offer.totalValue.toString()))}</td>
                      <td>—</td>
                      <td>
                        <span className="admin-badge pending" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B" }}>
                          Awaiting Payment
                        </span>
                      </td>
                      <td>{offer.respondedAt ? formatDate(offer.respondedAt) : "—"}</td>
                      <td>
                        <Link href={`/admin/requests/${offer.kit.id}?from=payments`} className="admin-table-link" style={{ fontWeight: 500 }}>
                          Create Payment
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {/* Payment rows */}
                  {filteredPayments.map((payment) => {
                    const nextStatus = getNextStatus(payment.status);
                    const isThisUpdating = updatingId === payment.id;
                    return (
                      <tr key={payment.id}>
                        <td>
                          <Link href={`/admin/requests/${payment.offer.kit.id}?from=payments`} className="admin-table-link">
                            {payment.offer.kit.kitNumber}
                          </Link>
                        </td>
                        <td>{payment.paymentNumber}</td>
                        <td>{payment.customer.firstName} {payment.customer.lastName}</td>
                        <td>{formatCurrency(parseFloat(payment.amount.toString()))}</td>
                        <td>{payment.method}</td>
                        <td>
                          <span className={`admin-badge ${getStatusBadgeClass(payment.status)}`}>
                            {formatStatus(payment.status)}
                          </span>
                        </td>
                        <td>{formatDate(payment.completedAt || payment.sentAt || payment.createdAt)}</td>
                        <td>
                          {nextStatus && (
                            <button
                              onClick={() => handleUpdateStatus(payment.id, nextStatus)}
                              disabled={isThisUpdating}
                              className="admin-table-link"
                              style={{ cursor: isThisUpdating ? "default" : "pointer" }}
                            >
                              {isThisUpdating ? "..." : STATUS_LABELS[nextStatus]}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />

      <ConfirmDialog
        isOpen={!!pendingUpdate}
        title="Confirm Payment Update"
        message={pendingUpdate ? `Are you sure you want to ${(STATUS_LABELS[pendingUpdate.status] || pendingUpdate.status).toLowerCase()} this payment?` : ""}
        confirmLabel={pendingUpdate ? STATUS_LABELS[pendingUpdate.status] || "Confirm" : "Confirm"}
        variant="warning"
        onConfirm={() => pendingUpdate && executeUpdateStatus(pendingUpdate.id, pendingUpdate.status)}
        onCancel={() => setPendingUpdate(null)}
      />
    </div>
  );
}
