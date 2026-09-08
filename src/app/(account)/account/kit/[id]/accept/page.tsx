"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import KitDestination from "@/components/account/KitDestination";
import Link from "next/link";
import { AccountContainer, PaymentOption } from "@/components/account";
import { AlertDialog } from "@/components/shared";
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
  { method: "VENMO", label: "Venmo" },
];

interface OfferSummary {
  kitId: string;
  kitNumber: string;
  offerId: string;
  offerValue: number;
  offerExpiresAt?: string;
  defaultPaymentMethod?: PaymentMethod;
  paymentDestinations: Record<string, string>;
  mailingAddress: string;
}

export default function AcceptOfferPage() {
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [summary, setSummary] = useState<OfferSummary | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("CHECK");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlert, setErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      const result = await getKitOfferSummary(kitId);
      if (!result.success || !result.data) {
        if (isMounted) { setLoadError(result.error || "Unable to load this offer."); setIsLoading(false); }
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
      setErrorMessage(error instanceof Error ? error.message : "Unable to accept the offer. Please try again.");
      setErrorAlert(true);
      setIsSubmitting(false);
    }
  };

  if (loadError) return <AccountContainer headerProps={{ title: "Offer unavailable", showBackButton: true, backHref: `/account/kit/${kitId}` }}><p role="alert">{loadError}</p><Link href={`/account/kit/${kitId}`} className="underline">View the latest kit status</Link><button type="button" onClick={() => window.location.reload()} className="block underline mt-4">Try again</button></AccountContainer>;

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
      <KitDestination kitId={kitId} address={summary.mailingAddress} onUpdated={async () => { const result = await getKitOfferSummary(kitId); if (result.success && result.data) setSummary(result.data); }} />
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
            detail={option.method === "CHECK" ? summary.mailingAddress : option.method === "ACH" ? (summary.paymentDestinations.bankAccount ? `Bank account ${summary.paymentDestinations.bankAccount}` : "Add bank details in Settings") : summary.paymentDestinations[option.method === "PAYPAL" ? "paypalEmail" : option.method === "ZELLE" ? "zellePhone" : "venmoHandle"] || "Add payment details in Settings"}
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
      <AlertDialog
        isOpen={errorAlert}
        title="Error"
        message={errorMessage}
        onClose={() => setErrorAlert(false)}
      />
    </AccountContainer>
  );
}
