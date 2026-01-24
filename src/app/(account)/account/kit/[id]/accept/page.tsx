"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AccountContainer, PaymentOption } from "@/components/account";
import {
  getSession,
  getKitSummary,
  getPaymentPreferences,
  simulateAcceptOffer,
  formatCurrency,
  generateKitNumber,
  PaymentMethod,
  KitSummary,
} from "@/lib/account";

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string }[] = [
  { method: "check", label: "Check" },
  { method: "paypal", label: "PayPal" },
  { method: "zelle", label: "Zelle" },
  { method: "bank_transfer", label: "Bank Transfer" },
];

export default function AcceptOfferPage() {
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [summary, setSummary] = useState<KitSummary | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/account/login");
      return;
    }

    const summaryData = getKitSummary(kitId);
    if (!summaryData || !summaryData.offer) {
      router.replace("/account");
      return;
    }

    setSummary(summaryData);

    // Load payment preferences
    const prefs = getPaymentPreferences(session.userId);
    if (prefs.defaultMethod) {
      setSelectedPayment(prefs.defaultMethod);
    }
    setPaymentDetails({
      paypal: prefs.paypalEmail || "-",
      zelle: prefs.zellePhone || "-",
      bank_transfer: prefs.bankAccount || "-",
      check: "Mailed to your address",
    });

    setIsLoading(false);
  }, [router, kitId]);

  const handleConfirm = () => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    const success = simulateAcceptOffer(kitId, selectedPayment);
    if (success) {
      router.push(`/account/kit/${kitId}?accepted=true`);
    } else {
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <AccountContainer
        headerProps={{
          showBackButton: true,
          backHref: `/account/kit/${kitId}`,
          title: "Accept Offer",
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--status-gray)" }}>Loading...</p>
        </div>
      </AccountContainer>
    );
  }

  const offerValue = summary.offer?.totalValue || 0;

  return (
    <AccountContainer
      headerProps={{
        showBackButton: true,
        backHref: `/account/kit/${kitId}`,
        title: "Accept Offer",
      }}
    >
      {/* Offer Details */}
      <div className="account-section">
        <div className="account-section-title">Offer Details</div>
        <div className="account-kit-summary">
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Kit</span>
            <span className="account-kit-summary-value">
              #{generateKitNumber(kitId)}
            </span>
          </div>
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Total Value</span>
            <span
              className="account-kit-summary-value"
              style={{ fontSize: 18, color: "var(--brand-primary)" }}
            >
              {formatCurrency(offerValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="account-section">
        <div className="account-section-title">Payment Method</div>

        {PAYMENT_OPTIONS.map((option) => (
          <PaymentOption
            key={option.method}
            method={option.method}
            label={option.label}
            detail={paymentDetails[option.method]}
            selected={selectedPayment === option.method}
            onChange={setSelectedPayment}
          />
        ))}

        <Link
          href="/account/settings"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 12,
            fontSize: 13,
            color: "var(--brand-primary)",
          }}
        >
          Manage payment methods
        </Link>
      </div>

      <p className="account-disclaimer">
        By accepting, you agree to our{" "}
        <Link href="/terms-conditions">Terms of Service</Link>.
      </p>

      <button
        onClick={handleConfirm}
        className="account-btn account-btn-success account-btn-full"
        disabled={!selectedPayment || isSubmitting}
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
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {selectedPayment
          ? `Confirm & Accept - ${formatCurrency(offerValue)}`
          : "Select a payment method"}
      </button>
    </AccountContainer>
  );
}
