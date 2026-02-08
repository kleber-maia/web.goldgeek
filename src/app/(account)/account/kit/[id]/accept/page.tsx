"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AccountContainer, PaymentOption } from "@/components/account";
import {
  formatCurrency,
  PaymentMethod,
} from "@/lib/account";
import {
  acceptOffer,
  getKitOfferSummary,
} from "@/lib/actions/customer.actions";

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string }[] = [
  { method: "CHECK", label: "Check" },
  { method: "PAYPAL", label: "PayPal" },
  { method: "ZELLE", label: "Zelle" },
  { method: "ACH", label: "Bank Transfer" },
];

const PAYMENT_DETAILS: Record<PaymentMethod, string> = {
  CHECK: "Mailed to your address",
  PAYPAL: "PayPal email on file",
  ZELLE: "Zelle phone/email on file",
  ACH: "Bank account on file",
  VENMO: "Venmo handle on file",
};

interface OfferSummary {
  kitId: string;
  kitNumber: string;
  offerId: string;
  offerValue: number;
  offerExpiresAt?: string;
  defaultPaymentMethod?: PaymentMethod;
}

export default function AcceptOfferPage() {
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [summary, setSummary] = useState<OfferSummary | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("CHECK");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      const result = await getKitOfferSummary(kitId);
      if (!result.success || !result.data) {
        router.replace("/account");
        return;
      }
      if (!isMounted) return;
      setSummary(result.data);
      setSelectedPayment(result.data.defaultPaymentMethod || "CHECK");
      setIsLoading(false);
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [router, kitId]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (!summary) {
        throw new Error("Offer summary not available");
      }
      const result = await acceptOffer(summary.offerId, selectedPayment);
      if (result.success) {
        router.push(`/account/kit/${kitId}?accepted=true`);
      } else {
        throw new Error(result.error || "Failed to accept offer");
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
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
              #{summary.kitNumber}
            </span>
          </div>
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Total Value</span>
            <span
              className="account-kit-summary-value"
              style={{ fontSize: 18, color: "var(--brand-primary)" }}
            >
              {formatCurrency(summary.offerValue)}
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
            detail={PAYMENT_DETAILS[option.method]}
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
        disabled={isSubmitting}
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
        {`Confirm & Accept - ${formatCurrency(summary.offerValue)}`}
      </button>
    </AccountContainer>
  );
}
