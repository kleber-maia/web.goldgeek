"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountContainer } from "@/components/account";
import {
  getSession,
  getCustomerById,
  getPaymentPreferences,
  logout,
  Customer,
  PaymentMethod,
  PaymentPreferences,
} from "@/lib/account";

export default function SettingsPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentPrefs, setPaymentPrefs] = useState<PaymentPreferences>({
    defaultMethod: "check",
  });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("check");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [zellePhone, setZellePhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/account/login");
      return;
    }

    const customerData = getCustomerById(session.userId);
    setCustomer(customerData || null);

    const prefs = getPaymentPreferences(session.userId);
    setPaymentPrefs(prefs);
    setSelectedMethod(prefs.defaultMethod);
    setPaypalEmail(prefs.paypalEmail || "");
    setZellePhone(prefs.zellePhone || "");

    setIsLoading(false);
  }, [router]);

  const handleSavePayment = () => {
    setIsSaving(true);
    // In a real app, this would save to the backend
    setTimeout(() => {
      setIsSaving(false);
      alert("Payment preferences saved!");
    }, 500);
  };

  const handleLogout = () => {
    logout();
    router.replace("/account/login");
  };

  if (isLoading) {
    return (
      <AccountContainer
        headerProps={{
          showBackButton: true,
          backHref: "/account",
          title: "Settings",
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--status-gray)" }}>Loading...</p>
        </div>
      </AccountContainer>
    );
  }

  return (
    <AccountContainer
      headerProps={{
        showBackButton: true,
        backHref: "/account",
        title: "Settings",
      }}
    >
      {/* Profile Section */}
      <div className="account-settings-section">
        <div className="account-settings-section-title">Profile</div>
        <div className="account-profile-name">
          {customer?.name || "Customer"}
        </div>
        <div className="account-profile-email">
          {customer?.email || "email@example.com"}
        </div>
        {customer?.address && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--account-border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--status-gray)",
                marginBottom: 4,
              }}
            >
              Shipping Address
            </div>
            <div className="account-profile-address">
              {customer.address.street}
              <br />
              {customer.address.city}, {customer.address.state}{" "}
              {customer.address.zip}
            </div>
          </div>
        )}
      </div>

      {/* Payment Preferences Section */}
      <div className="account-settings-section">
        <div className="account-settings-section-title">
          Payment Preferences
        </div>

        <div className="account-form-group">
          <label className="account-form-label" htmlFor="default-method">
            Default Payment Method
          </label>
          <select
            id="default-method"
            className="account-form-select"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
          >
            <option value="check">Check (mailed)</option>
            <option value="paypal">PayPal</option>
            <option value="zelle">Zelle</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        {selectedMethod === "paypal" && (
          <div className="account-form-group">
            <label className="account-form-label" htmlFor="paypal-email">
              PayPal Email
            </label>
            <input
              type="email"
              id="paypal-email"
              className="account-form-input"
              placeholder="your.paypal@email.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
            />
          </div>
        )}

        {selectedMethod === "zelle" && (
          <div className="account-form-group">
            <label className="account-form-label" htmlFor="zelle-phone">
              Zelle Phone or Email
            </label>
            <input
              type="text"
              id="zelle-phone"
              className="account-form-input"
              placeholder="(555) 123-4567 or email"
              value={zellePhone}
              onChange={(e) => setZellePhone(e.target.value)}
            />
          </div>
        )}

        {selectedMethod === "bank_transfer" && (
          <>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="bank-routing">
                Routing Number
              </label>
              <input
                type="text"
                id="bank-routing"
                className="account-form-input"
                placeholder="9 digits"
              />
            </div>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="bank-account">
                Account Number
              </label>
              <input
                type="text"
                id="bank-account"
                className="account-form-input"
                placeholder="Account number"
              />
            </div>
          </>
        )}

        <button
          onClick={handleSavePayment}
          className="account-btn account-btn-primary account-btn-full"
          disabled={isSaving}
          style={{ marginTop: 8 }}
        >
          {isSaving ? "Saving..." : "Save Payment Preferences"}
        </button>
      </div>

      {/* Help Section */}
      <div className="account-settings-section">
        <div className="account-settings-section-title">Need Help?</div>
        <p
          style={{
            fontSize: 14,
            color: "var(--status-gray)",
            margin: "0 0 12px 0",
          }}
        >
          Questions about your appraisal or payment?
        </p>
        <Link
          href="mailto:support@goldgeek.com"
          className="account-btn account-btn-secondary account-btn-full"
        >
          <svg
            width="18"
            height="18"
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
          Contact Support
        </Link>
      </div>

      {/* Logout Button */}
      <button onClick={handleLogout} className="account-logout-btn">
        <svg
          width="18"
          height="18"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
        Log Out
      </button>
    </AccountContainer>
  );
}
