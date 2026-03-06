"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
        background: "#AD7B2A",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function PaymentsClient({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    setIsUpdating(true);
    setErrorMsg("");
    try {
      const result = await updatePaymentStatus(paymentId, newStatus as any);
      if (result.success) {
        router.refresh();
      } else {
        setErrorMsg(result.error || "Failed to update status");
      }
    } catch {
      setErrorMsg("Failed to update payment status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Payments" backHref="/admin" />

        {/* Filter Tabs */}
        <div className="admin-filter-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
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
            filteredPayments.map((payment) => (
              <div key={payment.id} className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-id">{payment.paymentNumber}</div>
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
                  {payment.status === "PENDING" && (
                    <ActionButton label="Process" onClick={() => handleUpdateStatus(payment.id, "PROCESSING")} disabled={isUpdating} />
                  )}
                  {payment.status === "PROCESSING" && (
                    <ActionButton label="Mark Sent" onClick={() => handleUpdateStatus(payment.id, "SENT")} disabled={isUpdating} />
                  )}
                  {payment.status === "SENT" && (
                    <ActionButton label="Complete" onClick={() => handleUpdateStatus(payment.id, "COMPLETED")} disabled={isUpdating} />
                  )}
                </div>
              </div>
            ))
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
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.paymentNumber}</td>
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
                      {payment.status === "PENDING" && (
                        <button onClick={() => handleUpdateStatus(payment.id, "PROCESSING")} disabled={isUpdating} className="admin-table-link" style={{ cursor: "pointer" }}>
                          Process
                        </button>
                      )}
                      {payment.status === "PROCESSING" && (
                        <button onClick={() => handleUpdateStatus(payment.id, "SENT")} disabled={isUpdating} className="admin-table-link" style={{ cursor: "pointer" }}>
                          Mark Sent
                        </button>
                      )}
                      {payment.status === "SENT" && (
                        <button onClick={() => handleUpdateStatus(payment.id, "COMPLETED")} disabled={isUpdating} className="admin-table-link" style={{ cursor: "pointer" }}>
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
