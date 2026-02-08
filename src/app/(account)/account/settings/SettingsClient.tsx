"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountContainer } from "@/components/account";
import { PaymentMethod } from "@/lib/account";
import { updatePaymentPreferences } from "@/lib/actions/customer.actions";

interface AddressView {
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zipCode: string;
}

interface CustomerView {
  firstName: string;
  lastName: string;
  email: string;
  address?: AddressView;
}

interface SettingsClientProps {
  customer: CustomerView;
  defaultPaymentMethod: PaymentMethod;
}

export default function SettingsClient({
  customer,
  defaultPaymentMethod,
}: SettingsClientProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>(defaultPaymentMethod);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [zellePhone, setZellePhone] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  const handleSavePayment = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveStatus(null);

    try {
      const accountInfo: Record<string, string> = {};
      if (selectedMethod === "PAYPAL" && paypalEmail) {
        accountInfo.paypalEmail = paypalEmail;
      }
      if (selectedMethod === "ZELLE" && zellePhone) {
        accountInfo.zellePhone = zellePhone;
      }
      if (selectedMethod === "ACH") {
        if (bankRouting) accountInfo.bankRouting = bankRouting;
        if (bankAccount) accountInfo.bankAccount = bankAccount;
      }

      const result = await updatePaymentPreferences({
        method: selectedMethod,
        accountInfo,
      });

      if (result.success) {
        setSaveMessage("Payment preferences saved!");
        setSaveStatus("success");
      } else {
        setSaveMessage(result.error || "Failed to save payment preferences.");
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving payment preferences:", error);
      setSaveMessage("Something went wrong. Please try again.");
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.replace("/account/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const customerName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "Customer";

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
        <div className="account-profile-name">{customerName}</div>
        <div className="account-profile-email">{customer.email}</div>
        {customer.address && (
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
              {customer.address.street1}
              {customer.address.street2 && (
                <>
                  <br />
                  {customer.address.street2}
                </>
              )}
              <br />
              {customer.address.city}, {customer.address.state}{" "}
              {customer.address.zipCode}
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
            <option value="CHECK">Check (mailed)</option>
            <option value="PAYPAL">PayPal</option>
            <option value="ZELLE">Zelle</option>
            <option value="ACH">Bank Transfer</option>
          </select>
        </div>

        {selectedMethod === "PAYPAL" && (
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

        {selectedMethod === "ZELLE" && (
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

        {selectedMethod === "ACH" && (
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
                value={bankRouting}
                onChange={(e) => setBankRouting(e.target.value)}
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
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
            </div>
          </>
        )}

        {saveMessage && (
          <div
            className={`account-alert ${
              saveStatus === "error"
                ? "account-alert-error"
                : "account-alert-success"
            }`}
            style={{ marginBottom: 12 }}
          >
            {saveMessage}
          </div>
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
