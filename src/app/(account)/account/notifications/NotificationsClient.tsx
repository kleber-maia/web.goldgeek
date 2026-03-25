"use client";

import Link from "next/link";
import { AccountContainer } from "@/components/account";
import { getRelativeTimeShort } from "@/lib/format";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  kit: {
    id: string;
    kitNumber: string;
  } | null;
}

function getEventIcon(type: string): string {
  switch (type) {
    case "KIT_CREATED": return "\u{1F4E6}";
    case "STATUS_CHANGED": return "\u{1F504}";
    case "OFFER_GENERATED":
    case "OFFER_SENT": return "\u{1F4B0}";
    case "OFFER_ACCEPTED": return "\u2705";
    case "OFFER_DECLINED": return "\u274C";
    case "PAYMENT_INITIATED":
    case "PAYMENT_SENT":
    case "PAYMENT_COMPLETED": return "\u{1F4B3}";
    case "RETURN_REQUESTED":
    case "RETURN_SHIPPED":
    case "RETURN_DELIVERED": return "\u{1F4E8}";
    case "KIT_SENT":
    case "PACKAGE_IN_TRANSIT":
    case "PACKAGE_DELIVERED": return "\u{1F69A}";
    default: return "\u{1F514}";
  }
}

export default function NotificationsClient({ events }: { events: TimelineEvent[] }) {
  return (
    <AccountContainer
      headerProps={{
        title: "Notifications",
        backHref: "/account",
      }}
    >
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#6B7280" }}>
          <p style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 8px 0" }}>No notifications yet</p>
          <p style={{ fontSize: "14px", margin: 0 }}>Activity from your kits will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#E5E5E5", borderRadius: "8px", overflow: "hidden" }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                display: "flex",
                gap: "12px",
                padding: "14px 16px",
                background: "#FFFFFF",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "20px", lineHeight: 1 }}>{getEventIcon(event.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#2E1F0C" }}>
                    {event.title}
                  </span>
                  <span style={{ fontSize: "12px", color: "#9CA3AF", flexShrink: 0 }}>
                    {getRelativeTimeShort(event.createdAt)}
                  </span>
                </div>
                {event.description && (
                  <p style={{
                    margin: "4px 0 0 0",
                    fontSize: "13px",
                    color: "#6B7280",
                    lineHeight: 1.4,
                  }}>
                    {event.description
                      .replace(/_/g, " ")
                      .replace(/\b(PENDING|SHIPPED|EVALUATING|OFFER_SENT|ACCEPTED|DECLINED|PAID|RETURNED|CANCELLED)\b/g,
                        (match) => match.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                      )}
                  </p>
                )}
                {event.kit && (
                  <Link
                    href={`/account/kit/${event.kit.id}`}
                    style={{
                      display: "inline-block",
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "#AD7B2A",
                      textDecoration: "none",
                    }}
                  >
                    {event.kit.kitNumber} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountContainer>
  );
}
