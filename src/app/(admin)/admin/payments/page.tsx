"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";

// Mock data for payments
const payments = [
  {
    id: "p1",
    displayId: "Payment #P1",
    customer: "John Doe",
    offerId: "o2",
    offerDisplayId: "#O2",
    amount: "$3,607.60",
    method: "PayPal",
    status: "pending",
    date: null,
  },
  {
    id: "p2",
    displayId: "Payment #P2",
    customer: "Jane Smith",
    offerId: "o3",
    offerDisplayId: "#O3",
    amount: "$1,852.15",
    method: "Check",
    status: "completed",
    date: "Jan 5, 2025",
  },
];

const filterTabs = ["All", "Pending", "Completed"];

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return "pending";
    case "completed":
      return "success";
    default:
      return "gray";
  }
}

export default function PaymentsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredPayments = payments.filter((payment) =>
    activeFilter === "All" || payment.status === activeFilter.toLowerCase()
  );

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
              {tab}
            </button>
          ))}
        </div>

        {/* Payment Cards (Mobile) */}
        <div className="admin-card-list">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-id">{payment.displayId}</div>
                  <div className="admin-card-name">{payment.customer}</div>
                </div>
                <span className={`admin-badge ${getStatusBadgeClass(payment.status)}`}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
              <div className="admin-card-meta">Offer {payment.offerDisplayId} &bull; {payment.method}</div>
              <div className="admin-card-footer">
                <span style={{ fontSize: "18px", fontWeight: 600, color: "#AD7B2A" }}>{payment.amount}</span>
                {payment.status === "pending" ? (
                  <button className="admin-btn admin-btn-success" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Process
                  </button>
                ) : (
                  <span style={{ fontSize: "12px", color: "#10B981" }}>Paid {payment.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Offer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.displayId.replace("Payment ", "")}</td>
                  <td>{payment.customer}</td>
                  <td>
                    <Link href={`/admin/offers/${payment.offerId}`} className="admin-table-link">
                      {payment.offerDisplayId}
                    </Link>
                  </td>
                  <td>{payment.amount}</td>
                  <td>{payment.method}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {payment.status === "pending" ? (
                      <button className="admin-btn admin-btn-success" style={{ padding: "6px 12px", fontSize: "12px" }}>
                        Process
                      </button>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>{payment.date}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
