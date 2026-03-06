"use client";

import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date | string;
  addresses: Array<{
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
  }>;
  kits: Array<{
    id: string;
    kitNumber: string;
    status: string;
    createdAt: Date | string;
    items: unknown[];
  }>;
  payments: Array<{
    id: string;
    paymentNumber: string;
    amount: { toString(): string };
    method: string;
    status: string;
    createdAt: Date | string;
    completedAt?: Date | string | null;
    offer: { kit: { kitNumber: string } };
  }>;
}

export default function CustomerDetailClient({ customer }: { customer: Customer }) {
  const totalPaid = customer.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);

  const offersAccepted = customer.kits.filter((k) => k.status === "ACCEPTED" || k.status === "PAID").length;
  const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`;
  const defaultAddress = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main" style={{ paddingBottom: "100px" }}>
        {/* Header */}
        <div className="admin-detail-header">
          <Link href="/admin/customers" className="admin-back-btn">
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 className="admin-detail-title">
              {customer.firstName} {customer.lastName}
            </h1>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "4px" }}>
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        {/* Customer Profile */}
        <div className="admin-section">
          <div className="admin-section-title">Customer Information</div>
          <div className="admin-customer-profile">
            <div className="admin-customer-avatar">
              {initials}
            </div>
            <div className="admin-customer-info">
              <div className="admin-info-grid">
                <div>
                  <div className="admin-info-label">Email</div>
                  <div className="admin-info-value">{customer.email}</div>
                </div>
                <div>
                  <div className="admin-info-label">Phone</div>
                  <div className="admin-info-value">{customer.phone || "N/A"}</div>
                </div>
                <div>
                  <div className="admin-info-label">Address</div>
                  <div className="admin-info-value">
                    {defaultAddress ? (
                      <>
                        {defaultAddress.street1}<br />
                        {defaultAddress.street2 && <>{defaultAddress.street2}<br /></>}
                        {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}
                      </>
                    ) : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-section">
          <div className="admin-section-title">Statistics</div>
          <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Total Kits</div>
              <div className="admin-stat-value">{customer.kits.length}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Offers Accepted</div>
              <div className="admin-stat-value">{offersAccepted}</div>
            </div>
            <div className="admin-stat-card primary">
              <div className="admin-stat-label">Total Paid</div>
              <div className="admin-stat-value">{formatCurrency(totalPaid)}</div>
            </div>
          </div>
        </div>

        {/* Kits */}
        <div className="admin-section">
          <div className="admin-section-title">Kits ({customer.kits.length})</div>

          {/* Mobile Card List */}
          <div className="admin-card-list">
            {customer.kits.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                No kits yet
              </div>
            ) : (
              customer.kits.map((kit) => (
                <Link
                  key={kit.id}
                  href={`/admin/requests/${kit.id}`}
                  className="admin-card"
                >
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-id">{kit.kitNumber}</div>
                      <div className="admin-card-meta">{formatDate(kit.createdAt)}</div>
                    </div>
                    <span className={`admin-badge ${getStatusBadgeClass(kit.status)}`}>
                      {formatStatus(kit.status)}
                    </span>
                  </div>
                  <div className="admin-card-footer">
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      {kit.items.length} items
                    </span>
                    <svg className="admin-card-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kit ID</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customer.kits.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                      No kits yet
                    </td>
                  </tr>
                ) : (
                  customer.kits.map((kit) => (
                    <tr key={kit.id}>
                      <td>
                        <Link href={`/admin/requests/${kit.id}`} className="admin-table-link">
                          {kit.kitNumber}
                        </Link>
                      </td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(kit.status)}`}>
                          {formatStatus(kit.status)}
                        </span>
                      </td>
                      <td>{kit.items.length} items</td>
                      <td>{formatDate(kit.createdAt)}</td>
                      <td>
                        <Link href={`/admin/requests/${kit.id}`} className="admin-table-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="admin-section">
          <div className="admin-section-title">Payment History ({customer.payments.length})</div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Kit</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {customer.payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  customer.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.paymentNumber}</td>
                      <td>{payment.offer.kit.kitNumber}</td>
                      <td>{formatCurrency(parseFloat(payment.amount.toString()))}</td>
                      <td>{payment.method}</td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(payment.status)}`}>
                          {formatStatus(payment.status)}
                        </span>
                      </td>
                      <td>{formatDate(payment.completedAt || payment.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
