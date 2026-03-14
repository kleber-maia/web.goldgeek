"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import { updateCustomerProfile, updateCustomerAddress } from "@/lib/actions/admin/customer.actions";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date | string;
  paymentPreferences?: {
    method?: string;
    accountInfo?: Record<string, string>;
  } | null;
  addresses: Array<{
    id: string;
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

const METHOD_LABELS: Record<string, string> = {
  CHECK: "Check",
  ACH: "Bank Transfer",
  ZELLE: "Zelle",
  PAYPAL: "PayPal",
  VENMO: "Venmo",
};

export default function CustomerDetailClient({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultAddress = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];

  // Form state
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone || "");
  const [street1, setStreet1] = useState(defaultAddress?.street1 || "");
  const [street2, setStreet2] = useState(defaultAddress?.street2 || "");
  const [city, setCity] = useState(defaultAddress?.city || "");
  const [state, setState] = useState(defaultAddress?.state || "");
  const [zipCode, setZipCode] = useState(defaultAddress?.zipCode || "");

  const totalPaid = customer.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || "0"), 0);

  const offersAccepted = customer.kits.filter((k) => k.status === "ACCEPTED" || k.status === "PAID").length;
  const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`;

  function handleEditClick() {
    // Reset form to current customer data
    setFirstName(customer.firstName);
    setLastName(customer.lastName);
    setEmail(customer.email);
    setPhone(customer.phone || "");
    setStreet1(defaultAddress?.street1 || "");
    setStreet2(defaultAddress?.street2 || "");
    setCity(defaultAddress?.city || "");
    setState(defaultAddress?.state || "");
    setZipCode(defaultAddress?.zipCode || "");
    setError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    // Basic validation
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update profile
      const profileResult = await updateCustomerProfile(customer.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      if (!profileResult.success) {
        setError(profileResult.error || "Failed to update profile.");
        setSaving(false);
        return;
      }

      // Update address if any address field is filled
      const hasAddressData = street1.trim() || city.trim() || state.trim() || zipCode.trim();
      if (hasAddressData) {
        if (!street1.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
          setError("Please fill in all required address fields (street, city, state, zip).");
          setSaving(false);
          return;
        }

        const addressResult = await updateCustomerAddress(customer.id, {
          street1: street1.trim(),
          street2: street2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
        });

        if (!addressResult.success) {
          setError(addressResult.error || "Failed to update address.");
          setSaving(false);
          return;
        }
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isEditing ? "16px" : "0" }}>
            <div className="admin-section-title">Customer Information</div>
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="admin-btn admin-btn-secondary"
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ marginRight: "4px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {error && (
            <div style={{
              background: "#FEE2E2",
              color: "#DC2626",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "12px",
            }}>
              {error}
            </div>
          )}

          {isEditing ? (
            /* Edit Mode */
            <div className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">First Name</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Last Name</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Email</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Phone</label>
                  <input
                    type="tel"
                    className="admin-form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E5E5E5", paddingTop: "12px", marginTop: "4px" }}>
                <div className="admin-form-label" style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>
                  Address
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Street Address</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={street1}
                    onChange={(e) => setStreet1(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Street Address 2</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={street2}
                    onChange={(e) => setStreet2(e.target.value)}
                    placeholder="Apt, suite, unit, etc. (optional)"
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">City</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">State</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. CA"
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ maxWidth: "200px" }}>
                  <label className="admin-form-label">Zip Code</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="admin-btn admin-btn-primary"
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Read-Only Mode */
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
          )}
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

        {/* Payment Preferences */}
        {customer.paymentPreferences?.method && (
          <div className="admin-section">
            <div className="admin-section-title">Payment Preferences</div>
            <div className="admin-info-grid">
              <div>
                <div className="admin-info-label">Preferred Method</div>
                <div className="admin-info-value">
                  {METHOD_LABELS[customer.paymentPreferences.method] || customer.paymentPreferences.method}
                </div>
              </div>
              {customer.paymentPreferences.accountInfo?.paypalEmail && (
                <div>
                  <div className="admin-info-label">PayPal Email</div>
                  <div className="admin-info-value">{customer.paymentPreferences.accountInfo.paypalEmail}</div>
                </div>
              )}
              {customer.paymentPreferences.accountInfo?.zellePhone && (
                <div>
                  <div className="admin-info-label">Zelle Phone/Email</div>
                  <div className="admin-info-value">{customer.paymentPreferences.accountInfo.zellePhone}</div>
                </div>
              )}
              {customer.paymentPreferences.accountInfo?.bankRouting && (
                <div>
                  <div className="admin-info-label">Routing Number</div>
                  <div className="admin-info-value" style={{ fontFamily: "monospace" }}>
                    {customer.paymentPreferences.accountInfo.bankRouting}
                  </div>
                </div>
              )}
              {customer.paymentPreferences.accountInfo?.bankAccount && (
                <div>
                  <div className="admin-info-label">Account Number</div>
                  <div className="admin-info-value" style={{ fontFamily: "monospace" }}>
                    {customer.paymentPreferences.accountInfo.bankAccount}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
