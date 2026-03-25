"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";

interface Offer {
  id: string;
  offerNumber: string;
  status: string;
  totalValue: any;
  sentAt: Date | string | null;
  expiresAt: Date | string;
  respondedAt: Date | string | null;
  kit: {
    id: string;
    kitNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    };
  };
  payment?: {
    status: string;
  } | null;
}

interface EvalKit {
  id: string;
  kitNumber: string;
  status: string;
  receivedAt: Date | string | null;
  createdAt: Date | string;
  customer: {
    firstName: string;
    lastName: string;
  };
  items: any[];
}

const FILTER_TABS = ["all", "ready_for_eval", "sent", "completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const FILTER_LABELS: Record<FilterTab, string> = {
  all: "All",
  ready_for_eval: "Ready for Eval",
  sent: "Awaiting Response",
  completed: "Completed",
};

// Only tabs where admin must act get a gold badge
const ACTION_TABS = new Set<FilterTab>(["ready_for_eval"]);

function getDaysWaiting(dateStr: Date | string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export default function OffersClient({
  offers,
  evaluationKits,
}: {
  offers: Offer[];
  evaluationKits: EvalKit[];
}) {
  const searchParams = useSearchParams();

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: evaluationKits.length + offers.length,
      ready_for_eval: evaluationKits.length,
      sent: 0, completed: 0,
    };
    for (const o of offers) {
      if (o.status === "SENT") counts.sent++;
      else if (["ACCEPTED", "DECLINED", "EXPIRED"].includes(o.status)) counts.completed++;
    }
    return counts;
  }, [offers, evaluationKits]);

  const initialFilter = searchParams.get("status");
  const [activeFilter, setActiveFilter] = useState<FilterTab>(
    initialFilter && FILTER_TABS.includes(initialFilter as FilterTab) ? initialFilter as FilterTab : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Search helpers
  const matchesSearch = (name: string, ...fields: string[]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || fields.some((f) => f.toLowerCase().includes(q));
  };

  // Filtered evaluation kits
  const filteredEvalKits = evaluationKits.filter((kit) => {
    if (activeFilter !== "all" && activeFilter !== "ready_for_eval") return false;
    const name = `${kit.customer.firstName} ${kit.customer.lastName}`;
    return matchesSearch(name, kit.kitNumber);
  });

  // Filtered offers — tabs group statuses, "All" shows everything
  const filteredOffers = offers.filter((offer) => {
    if (activeFilter === "ready_for_eval") return false;
    if (activeFilter === "sent") return offer.status === "SENT";
    if (activeFilter === "completed") return ["ACCEPTED", "DECLINED", "EXPIRED"].includes(offer.status);
    if (activeFilter !== "all") return false;
    const name = `${offer.kit.customer.firstName} ${offer.kit.customer.lastName}`;
    return matchesSearch(name, offer.offerNumber, offer.kit.kitNumber);
  });

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Offers" backHref="/admin" />

        {/* Filter Tabs */}
        <div className="admin-filter-tabs">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {FILTER_LABELS[tab]}
                {count > 0 && tab !== "all" && ACTION_TABS.has(tab) && (
                  <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: 600, minWidth: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "9px", padding: "0 5px", background: "#AD7B2A", color: "#FFFFFF" }}>{count}</span>
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
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredEvalKits.length === 0 && filteredOffers.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No offers found</div>
              </div>
            </div>
          ) : (
            <>
              {/* Evaluation kit cards */}
              {filteredEvalKits.map((kit) => {
                const days = getDaysWaiting(kit.receivedAt || kit.createdAt);
                return (
                  <Link
                    key={`kit-${kit.id}`}
                    href={`/admin/requests/${kit.id}?from=offers`}
                    className="admin-card"
                  >
                    <div className="admin-card-header">
                      <div>
                        <div className="admin-card-id">{kit.kitNumber}</div>
                        <div className="admin-card-name">
                          {kit.customer.firstName} {kit.customer.lastName}
                        </div>
                      </div>
                      <span className="admin-badge pending" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B" }}>
                        Needs Evaluation
                      </span>
                    </div>
                    <div className="admin-card-meta">
                      {kit.items.length} item{kit.items.length !== 1 ? "s" : ""} &bull; Received {formatDate(kit.receivedAt || kit.createdAt)}
                    </div>
                    <div className="admin-card-footer">
                      <span style={{ fontSize: "12px", color: days >= 3 ? "#DC2626" : days >= 1 ? "#F59E0B" : "#6B7280", fontWeight: days >= 1 ? 500 : 400 }}>
                        {days === 0 ? "Today" : `${days} day${days !== 1 ? "s" : ""} waiting`}
                      </span>
                      <svg className="admin-card-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                );
              })}

              {/* Offer cards */}
              {filteredOffers.map((offer) => (
                <Link
                  key={`offer-${offer.id}`}
                  href={`/admin/requests/${offer.kit.id}?from=offers`}
                  className="admin-card"
                >
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-id">{offer.kit.kitNumber}</div>
                      <div className="admin-card-name">
                        {offer.kit.customer.firstName} {offer.kit.customer.lastName}
                      </div>
                    </div>
                    <span className={`admin-badge ${getStatusBadgeClass(offer.status)}`}>
                      {formatStatus(offer.status)}
                    </span>
                  </div>
                  <div className="admin-card-meta">
                    {offer.offerNumber} &bull;{" "}
                    {offer.sentAt ? `Sent ${formatDate(offer.sentAt)}` : "Not yet sent"}
                  </div>
                  <div className="admin-card-footer">
                    <span style={{ fontSize: "14px", color: "#AD7B2A", fontWeight: 500 }}>
                      {formatCurrency(parseFloat(offer.totalValue.toString()))}
                    </span>
                    <svg className="admin-card-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kit</th>
                <th>Offer</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvalKits.length === 0 && filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                    No offers found
                  </td>
                </tr>
              ) : (
                <>
                  {/* Evaluation kit rows */}
                  {filteredEvalKits.map((kit) => {
                    const days = getDaysWaiting(kit.receivedAt || kit.createdAt);
                    return (
                      <tr key={`kit-${kit.id}`}>
                        <td>
                          <Link href={`/admin/requests/${kit.id}?from=offers`} className="admin-table-link">
                            {kit.kitNumber}
                          </Link>
                        </td>
                        <td style={{ color: "#6B7280", fontStyle: "italic" }}>—</td>
                        <td>{kit.customer.firstName} {kit.customer.lastName}</td>
                        <td>{kit.items.length} item{kit.items.length !== 1 ? "s" : ""}</td>
                        <td>
                          <span className="admin-badge pending" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B" }}>
                            Needs Evaluation
                          </span>
                        </td>
                        <td style={{ color: days >= 3 ? "#DC2626" : days >= 1 ? "#F59E0B" : "#6B7280", fontWeight: days >= 1 ? 500 : 400 }}>
                          {days === 0 ? "Today" : `${days}d waiting`}
                        </td>
                        <td>—</td>
                      </tr>
                    );
                  })}

                  {/* Offer rows */}
                  {filteredOffers.map((offer) => (
                    <tr key={`offer-${offer.id}`}>
                      <td>
                        <Link href={`/admin/requests/${offer.kit.id}?from=offers`} className="admin-table-link">
                          {offer.kit.kitNumber}
                        </Link>
                      </td>
                      <td>{offer.offerNumber}</td>
                      <td>{offer.kit.customer.firstName} {offer.kit.customer.lastName}</td>
                      <td>{formatCurrency(parseFloat(offer.totalValue.toString()))}</td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(offer.status)}`}>
                          {formatStatus(offer.status)}
                        </span>
                      </td>
                      <td>{offer.sentAt ? formatDate(offer.sentAt) : "—"}</td>
                      <td>{offer.status === "DRAFT" ? "—" : formatDate(offer.expiresAt)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
