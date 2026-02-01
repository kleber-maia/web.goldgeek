"use client";

import { use } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

// Mock data for customer detail
const mockCustomer = {
  id: "c1",
  name: "John Doe",
  initials: "JD",
  email: "john.doe@email.com",
  phone: "(555) 123-4567",
  address: "123 Main Street\nNew York, NY 10001",
  since: "Dec 15, 2024",
  stats: {
    requests: 2,
    offersAccepted: 1,
    totalPaid: "$3,607",
  },
  transactions: [
    {
      id: "r096",
      displayId: "#R096",
      type: "Digital",
      date: "Jan 2, 2025",
      items: "1oz Gold American Eagle coins (2)",
      value: "$3,607.60",
      status: "Accepted",
      paymentStatus: "Paid via PayPal",
    },
    {
      id: "r101",
      displayId: "#R101",
      type: "Digital",
      date: "Jan 10, 2025",
      items: null,
      value: null,
      status: "Pending",
      paymentStatus: null,
    },
  ],
};

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "accepted":
    case "paid":
      return "success";
    case "pending":
      return "pending";
    case "declined":
      return "error";
    default:
      return "gray";
  }
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In production, id would be used to fetch the customer from the API
  const _params = use(params);
  void _params.id;

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        {/* Mobile Header */}
        <header className="admin-header">
          <Link href="/admin/customers" className="admin-back-btn">
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <span className="admin-header-title">{mockCustomer.name}</span>
          <div style={{ width: "40px" }} />
        </header>

        {/* Customer Info Card */}
        <div className="admin-form-section" style={{ margin: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#AD7B2A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "24px", fontWeight: 600 }}>
              {mockCustomer.initials}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 600, color: "#2E1F0C" }}>{mockCustomer.name}</h2>
              <div style={{ fontSize: "13px", color: "#6B7280" }}>Customer since {mockCustomer.since}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>Email</div>
              <div style={{ fontSize: "14px", color: "#2E1F0C" }}>
                <a href={`mailto:${mockCustomer.email}`} style={{ color: "#AD7B2A", textDecoration: "none" }}>{mockCustomer.email}</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>Phone</div>
              <div style={{ fontSize: "14px", color: "#2E1F0C" }}>
                <a href={`tel:+1${mockCustomer.phone.replace(/\D/g, "")}`} style={{ color: "#AD7B2A", textDecoration: "none" }}>{mockCustomer.phone}</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>Address</div>
              <div style={{ fontSize: "14px", color: "#2E1F0C", whiteSpace: "pre-line" }}>{mockCustomer.address}</div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", padding: "0 16px", marginBottom: "24px" }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "16px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#AD7B2A" }}>{mockCustomer.stats.requests}</div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Requests</div>
          </div>
          <div style={{ background: "white", borderRadius: "8px", padding: "16px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#AD7B2A" }}>{mockCustomer.stats.offersAccepted}</div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Offers Accepted</div>
          </div>
          <div style={{ background: "white", borderRadius: "8px", padding: "16px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#10B981" }}>{mockCustomer.stats.totalPaid}</div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Total Paid</div>
          </div>
        </div>

        {/* Transaction History */}
        <div style={{ padding: "0 16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 12px 0", color: "#2E1F0C" }}>Transaction History</h3>
        </div>

        <div className="admin-card-list">
          {mockCustomer.transactions.map((tx) => (
            <div key={tx.id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-id">Request {tx.displayId}</div>
                  <div className="admin-card-meta">{tx.type} Kit &bull; {tx.date}</div>
                </div>
                <span className={`admin-badge ${getStatusBadgeClass(tx.status)}`}>{tx.status}</span>
              </div>
              {tx.items && (
                <div style={{ padding: "12px 0", borderTop: "1px solid #eee", marginTop: "8px" }}>
                  <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "8px" }}>Items evaluated:</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span>{tx.items}</span>
                    <span style={{ fontWeight: 600 }}>{tx.value}</span>
                  </div>
                </div>
              )}
              {!tx.items && (
                <div style={{ padding: "12px 0", borderTop: "1px solid #eee", marginTop: "8px" }}>
                  <div style={{ fontSize: "13px", color: "#6B7280" }}>Awaiting customer to send items</div>
                </div>
              )}
              <div className="admin-card-footer">
                <span style={{ fontSize: "14px", fontWeight: tx.paymentStatus ? 600 : 400, color: tx.paymentStatus?.includes("Paid") ? "#10B981" : "#6B7280" }}>
                  {tx.paymentStatus || "No items yet"}
                </span>
                <Link href={`/admin/requests/${tx.id}`} className="admin-table-link">View Details</Link>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table for Transaction History */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Type</th>
                <th>Date</th>
                <th>Items</th>
                <th>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockCustomer.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.displayId}</td>
                  <td>{tx.type}</td>
                  <td>{tx.date}</td>
                  <td>{tx.items || "-"}</td>
                  <td>{tx.value || "-"}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(tx.status)}`}>
                      {tx.paymentStatus?.includes("Paid") ? "Paid" : tx.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/requests/${tx.id}`} className="admin-table-link">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={{ padding: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href={`mailto:${mockCustomer.email}`} className="admin-btn admin-btn-primary" style={{ flex: 1, minWidth: "140px", textAlign: "center", textDecoration: "none" }}>
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Send Email
          </a>
          <a href={`tel:+1${mockCustomer.phone.replace(/\D/g, "")}`} className="admin-btn admin-btn-secondary" style={{ flex: 1, minWidth: "140px", textAlign: "center", textDecoration: "none" }}>
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Call
          </a>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
