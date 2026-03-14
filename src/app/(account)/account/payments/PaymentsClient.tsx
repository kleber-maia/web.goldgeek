"use client";

import Link from "next/link";
import { AccountContainer } from "@/components/account";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate } from "@/lib/account";

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number | { toString(): string };
  method: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  trackingNumber?: string;
  checkNumber?: string;
  offer: {
    kit: { id: string; kitNumber: string };
  };
}

interface PaymentsClientProps {
  payments: Payment[];
}

const STATUS_BADGE_MAP: Record<string, { className: string; label: string }> = {
  PENDING: { className: "pending", label: "Pending" },
  PROCESSING: { className: "in-progress", label: "Processing" },
  SENT: { className: "purple", label: "Payment Sent" },
  COMPLETED: { className: "success", label: "Completed" },
  FAILED: { className: "error", label: "Failed" },
};

const METHOD_LABELS: Record<string, string> = {
  CHECK: "Check",
  ACH: "Bank Transfer",
  ZELLE: "Zelle",
  PAYPAL: "PayPal",
  VENMO: "Venmo",
};

function getPaymentAmount(amount: number | { toString(): string }): number {
  if (typeof amount === "number") return amount;
  return parseFloat(amount.toString());
}

export default function PaymentsClient({ payments }: PaymentsClientProps) {
  return (
    <AccountContainer
      headerProps={{
        title: "My Payments",
        showBackButton: true,
      }}
    >
      {payments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--status-gray)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: "0 auto 16px", display: "block" }}
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--brand-secondary)",
              margin: "0 0 8px 0",
            }}
          >
            No payments yet
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--status-gray)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            When you accept an offer, your payment will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="account-section-divider">
            {payments.length} payment{payments.length !== 1 ? "s" : ""}
          </div>
          {payments.map((payment) => {
            const badge = STATUS_BADGE_MAP[payment.status] || {
              className: "gray",
              label: payment.status,
            };
            const methodLabel =
              METHOD_LABELS[payment.method] || payment.method;
            const amount = getPaymentAmount(payment.amount);

            return (
              <div
                key={payment.id}
                className="account-kit-card"
                style={{ cursor: "default" }}
              >
                {/* Header: payment number + status badge */}
                <div className="account-kit-card-header">
                  <div>
                    <div className="account-kit-id">
                      {payment.paymentNumber}
                    </div>
                    <Link
                      href={`/account/kit/${payment.offer.kit.id}`}
                      style={{
                        fontSize: 13,
                        color: "var(--brand-primary)",
                        textDecoration: "none",
                      }}
                    >
                      Kit #{payment.offer.kit.kitNumber}
                    </Link>
                  </div>
                  <span className={`account-badge ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Amount */}
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--brand-secondary)",
                    margin: "8px 0",
                  }}
                >
                  {formatCurrency(amount)}
                </div>

                {/* Details row */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px 20px",
                    fontSize: 13,
                    color: "var(--status-gray)",
                    marginBottom: 4,
                  }}
                >
                  <span>
                    <strong style={{ color: "var(--brand-text)" }}>
                      Method:
                    </strong>{" "}
                    {methodLabel}
                  </span>
                  {payment.checkNumber && (
                    <span>
                      <strong style={{ color: "var(--brand-text)" }}>
                        Check #:
                      </strong>{" "}
                      {payment.checkNumber}
                    </span>
                  )}
                  {payment.trackingNumber && (
                    <span>
                      <strong style={{ color: "var(--brand-text)" }}>
                        Tracking:
                      </strong>{" "}
                      {payment.trackingNumber}
                    </span>
                  )}
                </div>

                {/* Footer: date */}
                <div className="account-kit-card-footer">
                  <span className="account-kit-date">
                    {formatDate(payment.createdAt)}
                  </span>
                  {payment.completedAt && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--status-success)",
                      }}
                    >
                      Completed {formatDate(payment.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </AccountContainer>
  );
}
