"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountContainer } from "@/components/account";
import { PaymentMethod } from "@/lib/account";
import {
  updateProfile,
  updateAddress,
  addAddress,
  updatePaymentPreferences,
} from "@/lib/actions/customer.actions";

interface AddressView {
  id?: string;
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
  phone: string;
  address?: AddressView;
}

interface SettingsClientProps {
  customer: CustomerView;
  defaultPaymentMethod: PaymentMethod;
  savedAccountInfo?: Record<string, string>;
}

export default function SettingsClient({
  customer,
  defaultPaymentMethod,
  savedAccountInfo = {},
}: SettingsClientProps) {
  const router = useRouter();

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [phone, setPhone] = useState(customer.phone);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<"success" | "error" | null>(null);

  // Address editing state
  const [editingAddress, setEditingAddress] = useState(false);
  const [street1, setStreet1] = useState(customer.address?.street1 || "");
  const [street2, setStreet2] = useState(customer.address?.street2 || "");
  const [city, setCity] = useState(customer.address?.city || "");
  const [state, setState] = useState(customer.address?.state || "");
  const [zipCode, setZipCode] = useState(customer.address?.zipCode || "");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [addressStatus, setAddressStatus] = useState<"success" | "error" | null>(null);

  // Payment preferences state
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>(defaultPaymentMethod);
  const [paypalEmail, setPaypalEmail] = useState(savedAccountInfo.paypalEmail || "");
  const [zellePhone, setZellePhone] = useState(savedAccountInfo.zellePhone || "");
  const [bankRouting, setBankRouting] = useState(savedAccountInfo.bankRouting || "");
  const [bankAccount, setBankAccount] = useState(savedAccountInfo.bankAccount || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage(null);
    setProfileStatus(null);

    try {
      const result = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });

      if (result.success) {
        setProfileMessage("Profile updated successfully!");
        setProfileStatus("success");
        setEditingProfile(false);
        router.refresh();
      } else {
        setProfileMessage(result.error || "Failed to update profile.");
        setProfileStatus("error");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setProfileMessage("Something went wrong. Please try again.");
      setProfileStatus("error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setFirstName(customer.firstName);
    setLastName(customer.lastName);
    setPhone(customer.phone);
    setEditingProfile(false);
    setProfileMessage(null);
    setProfileStatus(null);
  };

  const handleSaveAddress = async () => {
    setIsSavingAddress(true);
    setAddressMessage(null);
    setAddressStatus(null);

    try {
      const addressData = {
        street1: street1.trim(),
        street2: street2.trim() || undefined,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
      };

      let result;
      if (customer.address?.id) {
        result = await updateAddress(customer.address.id, addressData);
      } else {
        result = await addAddress({
          type: "shipping",
          ...addressData,
          country: "US",
          isDefault: true,
        });
      }

      if (result.success) {
        setAddressMessage("Address updated successfully!");
        setAddressStatus("success");
        setEditingAddress(false);
        router.refresh();
      } else {
        setAddressMessage(result.error || "Failed to update address.");
        setAddressStatus("error");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      setAddressMessage("Something went wrong. Please try again.");
      setAddressStatus("error");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelAddress = () => {
    setStreet1(customer.address?.street1 || "");
    setStreet2(customer.address?.street2 || "");
    setCity(customer.address?.city || "");
    setState(customer.address?.state || "");
    setZipCode(customer.address?.zipCode || "");
    setEditingAddress(false);
    setAddressMessage(null);
    setAddressStatus(null);
  };

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
        router.refresh();
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
        <div
          className="account-settings-section-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>Profile</span>
          {!editingProfile && (
            <button
              onClick={() => {
                setEditingProfile(true);
                setProfileMessage(null);
                setProfileStatus(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-primary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              Edit
            </button>
          )}
        </div>

        {profileMessage && (
          <div
            className={`account-alert ${
              profileStatus === "error"
                ? "account-alert-error"
                : "account-alert-success"
            }`}
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background:
                profileStatus === "error"
                  ? "var(--status-error-bg)"
                  : "var(--status-success-bg)",
              color:
                profileStatus === "error"
                  ? "var(--status-error)"
                  : "var(--status-success)",
            }}
          >
            {profileMessage}
          </div>
        )}

        {editingProfile ? (
          <>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="profile-first-name">
                First Name
              </label>
              <input
                type="text"
                id="profile-first-name"
                className="account-form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="profile-last-name">
                Last Name
              </label>
              <input
                type="text"
                id="profile-last-name"
                className="account-form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="profile-phone">
                Phone
              </label>
              <input
                type="tel"
                id="profile-phone"
                className="account-form-input"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="account-form-group" style={{ marginBottom: 0 }}>
              <label className="account-form-label" htmlFor="profile-email">
                Email
              </label>
              <input
                type="email"
                id="profile-email"
                className="account-form-input"
                value={customer.email}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <div style={{ fontSize: 11, color: "var(--status-gray)", marginTop: 4 }}>
                Email cannot be changed
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button
                onClick={handleCancelProfile}
                className="account-btn account-btn-secondary"
                style={{ flex: 1 }}
                disabled={isSavingProfile}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="account-btn account-btn-primary"
                style={{ flex: 1 }}
                disabled={isSavingProfile || !firstName.trim() || !lastName.trim()}
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="account-profile-name">{customerName}</div>
            <div className="account-profile-email">{customer.email}</div>
            {customer.phone && (
              <div style={{ fontSize: 14, color: "var(--status-gray)", marginBottom: 4 }}>
                {customer.phone}
              </div>
            )}
          </>
        )}
      </div>

      {/* Address Section */}
      <div className="account-settings-section">
        <div
          className="account-settings-section-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>Shipping Address</span>
          {!editingAddress && (
            <button
              onClick={() => {
                setEditingAddress(true);
                setAddressMessage(null);
                setAddressStatus(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-primary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              {customer.address ? "Edit" : "Add"}
            </button>
          )}
        </div>

        {addressMessage && (
          <div
            className={`account-alert ${
              addressStatus === "error"
                ? "account-alert-error"
                : "account-alert-success"
            }`}
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background:
                addressStatus === "error"
                  ? "var(--status-error-bg)"
                  : "var(--status-success-bg)",
              color:
                addressStatus === "error"
                  ? "var(--status-error)"
                  : "var(--status-success)",
            }}
          >
            {addressMessage}
          </div>
        )}

        {editingAddress ? (
          <>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="address-street1">
                Street Address
              </label>
              <input
                type="text"
                id="address-street1"
                className="account-form-input"
                placeholder="123 Main St"
                value={street1}
                onChange={(e) => setStreet1(e.target.value)}
              />
            </div>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="address-street2">
                Apt / Suite / Unit (optional)
              </label>
              <input
                type="text"
                id="address-street2"
                className="account-form-input"
                placeholder="Apt 4B"
                value={street2}
                onChange={(e) => setStreet2(e.target.value)}
              />
            </div>
            <div className="account-form-group">
              <label className="account-form-label" htmlFor="address-city">
                City
              </label>
              <input
                type="text"
                id="address-city"
                className="account-form-input"
                placeholder="Dallas"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <div className="account-form-group" style={{ flex: 1 }}>
                <label className="account-form-label" htmlFor="address-state">
                  State
                </label>
                <input
                  type="text"
                  id="address-state"
                  className="account-form-input"
                  placeholder="TX"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className="account-form-group" style={{ flex: 1 }}>
                <label className="account-form-label" htmlFor="address-zip">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="address-zip"
                  className="account-form-input"
                  placeholder="75201"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 4,
              }}
            >
              <button
                onClick={handleCancelAddress}
                className="account-btn account-btn-secondary"
                style={{ flex: 1 }}
                disabled={isSavingAddress}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAddress}
                className="account-btn account-btn-primary"
                style={{ flex: 1 }}
                disabled={
                  isSavingAddress ||
                  !street1.trim() ||
                  !city.trim() ||
                  !state.trim() ||
                  !zipCode.trim()
                }
              >
                {isSavingAddress ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : customer.address ? (
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
        ) : (
          <div style={{ fontSize: 14, color: "var(--status-gray)" }}>
            No shipping address on file. Tap &quot;Add&quot; to enter one.
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
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background:
                saveStatus === "error"
                  ? "var(--status-error-bg)"
                  : "var(--status-success-bg)",
              color:
                saveStatus === "error"
                  ? "var(--status-error)"
                  : "var(--status-success)",
            }}
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
