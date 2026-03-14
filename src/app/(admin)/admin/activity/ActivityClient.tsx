"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatDate, formatStatus, formatDescription, getStatusBadgeClass } from "@/lib/admin-utils";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  kit: {
    id: string;
    kitNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
  user: {
    email: string;
  } | null;
}

const EVENT_TYPE_FILTERS = [
  "all",
  "KIT_CREATED",
  "STATUS_CHANGED",
  "OFFER_GENERATED",
  "OFFER_SENT",
  "OFFER_ACCEPTED",
  "OFFER_DECLINED",
  "PAYMENT_INITIATED",
  "PAYMENT_SENT",
  "PAYMENT_COMPLETED",
  "RETURN_REQUESTED",
  "NOTE_ADDED",
];

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
    case "NOTE_ADDED": return "\u{1F4DD}";
    default: return "\u{1F50D}";
  }
}

export default function ActivityClient({ events, total }: { events: TimelineEvent[]; total: number }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter((event) => {
    const matchesFilter = activeFilter === "all" || event.type === activeFilter;
    if (!matchesFilter) return false;

    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const customerName = event.kit?.customer
      ? `${event.kit.customer.firstName} ${event.kit.customer.lastName}`.toLowerCase()
      : "";
    return (
      event.title.toLowerCase().includes(term) ||
      (event.description?.toLowerCase().includes(term) ?? false) ||
      (event.kit?.kitNumber.toLowerCase().includes(term) ?? false) ||
      customerName.includes(term)
    );
  });

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Activity Log" backHref="/admin" />

        <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 16px 0" }}>
          {total} total events
        </p>

        {/* Filter Tabs - scrollable */}
        <div className="admin-filter-tabs" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
          {EVENT_TYPE_FILTERS.map((tab) => {
            const count = tab === "all"
              ? events.length
              : events.filter((e) => e.type === tab).length;
            if (tab !== "all" && count === 0) return null;
            return (
              <button
                key={tab}
                className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
                style={{ whiteSpace: "nowrap" }}
              >
                {tab === "all" ? "All" : formatStatus(tab)}
                {count > 0 && tab !== "all" && (
                  <span style={{ marginLeft: "4px", fontSize: "11px", opacity: 0.7 }}>({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="admin-search-wrapper">
          <svg className="admin-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="admin-search"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Event List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
          {filteredEvents.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", color: "#6B7280" }}>
              No events found
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "14px 16px",
                  background: "#fff",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{getEventIcon(event.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#2E1F0C" }}>
                      {event.title}
                    </span>
                    <span className={`admin-badge ${getStatusBadgeClass(event.type.split("_").pop() || "")}`} style={{ fontSize: "10px", flexShrink: 0 }}>
                      {formatStatus(event.type)}
                    </span>
                  </div>
                  {event.description && (
                    <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#6B7280", lineHeight: 1.4 }}>
                      {formatDescription(event.description)}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#9CA3AF", flexWrap: "wrap" }}>
                    <span>{formatDate(event.createdAt)}</span>
                    {event.kit && (
                      <Link href={`/admin/requests/${event.kit.id}`} style={{ color: "#AD7B2A" }}>
                        {event.kit.kitNumber}
                      </Link>
                    )}
                    {event.kit?.customer && (
                      <span>{event.kit.customer.firstName} {event.kit.customer.lastName}</span>
                    )}
                    {event.user && (
                      <span>by {event.user.email}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
