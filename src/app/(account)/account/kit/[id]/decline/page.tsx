"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AccountContainer } from "@/components/account";
import { AlertDialog } from "@/components/shared";
import {
  formatCurrency,
} from "@/lib/account";
import { declineOffer, getKitOfferSummary } from "@/lib/actions/customer.actions";

interface OfferSummary {
  kitId: string;
  kitNumber: string;
  offerId: string;
  offerValue: number;
}

export default function DeclineOfferPage() {
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [summary, setSummary] = useState<OfferSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlert, setErrorAlert] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      const result = await getKitOfferSummary(kitId);
      if (!result.success || !result.data) {
        router.replace("/account");
        return;
      }
      if (!isMounted) return;
      setSummary({
        kitId: result.data.kitId,
        kitNumber: result.data.kitNumber,
        offerId: result.data.offerId,
        offerValue: result.data.offerValue,
      });
      setIsLoading(false);
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [router, kitId]);

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      if (!summary) {
        throw new Error("Offer summary not available");
      }
      const result = await declineOffer(summary.offerId);
      if (result.success) {
        router.push(`/account/kit/${kitId}?declined=true`);
      } else {
        throw new Error(result.error || "Failed to decline offer");
      }
    } catch (error) {
      console.error("Error declining offer:", error);
      setErrorAlert(true);
      setIsSubmitting(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <AccountContainer
        headerProps={{
          showBackButton: true,
          backHref: `/account/kit/${kitId}`,
          title: "Decline Offer",
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
        title: "Decline Offer",
      }}
    >
      {/* Warning */}
      <div
        style={{
          background: "var(--status-pending-bg)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <svg
          style={{
            width: 24,
            height: 24,
            color: "var(--status-pending)",
            flexShrink: 0,
          }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div style={{ fontSize: 14, color: "var(--brand-text)" }}>
          <strong style={{ color: "var(--status-pending)" }}>
            Are you sure?
          </strong>
          <p style={{ margin: "8px 0 0 0" }}>
            If you decline this offer, we will return your items to you. Shipping
            is free, but this action cannot be undone.
          </p>
        </div>
      </div>

      {/* Offer Details */}
      <div className="account-section">
        <div className="account-section-title">Offer You&apos;re Declining</div>
        <div className="account-kit-summary">
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Kit</span>
            <span className="account-kit-summary-value">
              #{summary.kitNumber}
            </span>
          </div>
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Offer Amount</span>
            <span
              className="account-kit-summary-value"
              style={{ fontSize: 18, color: "var(--status-gray)", textDecoration: "line-through" }}
            >
              {formatCurrency(summary.offerValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link
          href={`/account/kit/${kitId}`}
          className="account-btn account-btn-primary account-btn-full"
        >
          Keep My Offer
        </Link>

        <button
          onClick={handleDecline}
          className="account-btn account-btn-full"
          disabled={isSubmitting}
          style={{
            background: "none",
            border: "1px solid var(--status-error)",
            color: "var(--status-error)",
          }}
        >
          {isSubmitting ? "Processing..." : "Decline & Return Items"}
        </button>
      </div>

      <p className="account-disclaimer" style={{ marginTop: 24 }}>
        Your items will be shipped back to your registered address within 5-7
        business days.
      </p>
      <AlertDialog
        isOpen={errorAlert}
        title="Error"
        message="Something went wrong. Please try again."
        onClose={() => setErrorAlert(false)}
      />
    </AccountContainer>
  );
}
