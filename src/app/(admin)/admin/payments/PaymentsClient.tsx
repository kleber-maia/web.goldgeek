"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatCurrency } from "@/lib/db/utils";
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

const filterTabs = ["all", "pending", "processing", "sent", "completed"];

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

export default function PaymentsClient({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("status") || "all";
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const filteredPayments = payments.filter((payment) => {
    const statusLower = payment.status.toLowerCase();
    const matchesFilter = activeFilter === "all" || statusLower === activeFilter;

    const customerName = `${payment.customer.firstName} ${payment.customer.lastName}`.toLowerCase();
    const matchesSearch =
      customerName.includes(searchQuery.toLowerCase()) ||
      payment.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    if (newStatus === "SENT" || newStatus === "COMPLETED") {
      if (!confirm(`Are you sure you want to ${statusLabel.toLowerCase()} this payment?`)) return;
    }

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
          {filterTabs.map((tab) => {
            const count = tab === "all"
              ? payments.length
              : payments.filter((p) => p.status.toLowerCase() === tab).length;
            return (
              <button
                key={tab}
                className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {count > 0 && tab !== "all" && (
                  <span style={{ marginLeft: "4px", fontSize: "11px", opacity: 0.7 }}>({count})</span>
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
          {filteredPayments.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No payments found</div>
              </div>
            </div>
          ) : (
            filteredPayments.map((payment) => {
              const nextStatus = getNextStatus(payment.status);
              const isThisUpdating = updatingId === payment.id;
              return (
                <div key={payment.id} className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-id">
                        <Link href={`/admin/payments/${payment.id}`} style={{ color: "#AD7B2A", textDecoration: "none" }}>
                          {payment.paymentNumber}
                        </Link>
                      </div>
                      <div className="admin-card-name">
                        {payment.customer.firstName} {payment.customer.lastName}
                      </div>
                    </div>
                    <span className={`admin-badge ${getStatusBadgeClass(payment.status)}`}>
                      {formatStatus(payment.status)}
                    </span>
                  </div>
                  <div className="admin-card-meta">
                    {payment.method} &bull; {formatDate(payment.createdAt)} &bull;{" "}
                    <Link href={`/admin/requests/${payment.offer.kit.id}`} style={{ color: "#AD7B2A" }}>
                      {payment.offer.kit.kitNumber}
                    </Link>
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
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Kit</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const nextStatus = getNextStatus(payment.status);
                  const isThisUpdating = updatingId === payment.id;
                  return (
                    <tr key={payment.id}>
                      <td>
                        <Link href={`/admin/payments/${payment.id}`} className="admin-table-link">
                          {payment.paymentNumber}
                        </Link>
                      </td>
                      <td>{payment.customer.firstName} {payment.customer.lastName}</td>
                      <td>
                        <Link href={`/admin/requests/${payment.offer.kit.id}`} className="admin-table-link">
                          {payment.offer.kit.kitNumber}
                        </Link>
                      </td>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
