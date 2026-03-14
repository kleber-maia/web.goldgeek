"use client";

import Link from "next/link";
import { AccountContainer } from "@/components/account";
import { formatDate } from "@/lib/account";

interface ReturnItem {
  id: string;
  returnNumber: string;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  kit: {
    id: string;
    kitNumber: string;
  };
}

interface ReturnsClientProps {
  returns: ReturnItem[];
}

const STATUS_BADGE_STYLES: Record<
  string,
  { background: string; color: string }
> = {
  PENDING: { background: "#FEF3C7", color: "#92400E" },
  LABEL_CREATED: { background: "#EDE9FE", color: "#6D28D9" },
  IN_TRANSIT: { background: "#DBEAFE", color: "#1D4ED8" },
  DELIVERED: { background: "#D1FAE5", color: "#065F46" },
};

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReturnsClient({ returns }: ReturnsClientProps) {
  return (
    <AccountContainer
      headerProps={{
        title: "My Returns",
        backHref: "/account",
        showBackButton: true,
      }}
    >
      {returns.length === 0 ? (
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
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--brand-secondary)",
              margin: "0 0 8px 0",
            }}
          >
            No returns yet
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--status-gray)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            If you decline an offer, your items will be returned and tracked
            here.
          </p>
        </div>
      ) : (
        <>
          <div className="account-section-divider">
            {returns.length} return{returns.length !== 1 ? "s" : ""}
          </div>
          {returns.map((ret) => {
            const badgeStyle = STATUS_BADGE_STYLES[ret.status] || {
              background: "#F3F4F6",
              color: "#6B7280",
            };

            return (
              <div
                key={ret.id}
                className="account-kit-card"
                style={{ cursor: "default" }}
              >
                {/* Header: return number + status badge */}
                <div className="account-kit-card-header">
                  <div>
                    <div className="account-kit-id">{ret.returnNumber}</div>
                    <Link
                      href={`/account/kit/${ret.kit.id}`}
                      style={{
                        fontSize: 13,
                        color: "var(--brand-primary)",
                        textDecoration: "none",
                      }}
                    >
                      Kit #{ret.kit.kitNumber}
                    </Link>
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: badgeStyle.background,
                      color: badgeStyle.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatStatus(ret.status)}
                  </span>
                </div>

                {/* Details */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 13,
                    color: "var(--status-gray)",
                    margin: "8px 0 4px",
                  }}
                >
                  {ret.trackingNumber && (
                    <span>
                      <strong style={{ color: "var(--brand-text)" }}>
                        Tracking:
                      </strong>{" "}
                      <a
                        href={`https://www.fedex.com/fedextrack/?trknbr=${ret.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--brand-primary)",
                          textDecoration: "none",
                        }}
                      >
                        {ret.trackingNumber}
                      </a>
                    </span>
                  )}
                  {ret.shippedAt && (
                    <span>
                      <strong style={{ color: "var(--brand-text)" }}>
                        Shipped:
                      </strong>{" "}
                      {formatDate(ret.shippedAt)}
                    </span>
                  )}
                  {ret.deliveredAt && (
                    <span>
                      <strong style={{ color: "var(--brand-text)" }}>
                        Delivered:
                      </strong>{" "}
                      {formatDate(ret.deliveredAt)}
                    </span>
                  )}
                </div>

                {/* Footer: created date */}
                <div className="account-kit-card-footer">
                  <span className="account-kit-date">
                    {formatDate(ret.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </AccountContainer>
  );
}
