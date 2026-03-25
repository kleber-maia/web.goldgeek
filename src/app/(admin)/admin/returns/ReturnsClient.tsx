"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatDate, formatStatus, getStatusBadgeClass, matchesSearch as matchesSearchUtil, getNextReturnStatus } from "@/lib/admin-utils";
import { updateReturnStatus } from "@/lib/actions/admin/shipping.actions";

interface Return {
  id: string;
  returnNumber: string;
  status: string;
  trackingNumber: string | null;
  createdAt: Date | string;
  shippedAt: Date | string | null;
  deliveredAt: Date | string | null;
  kit: {
    id: string;
    kitNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    };
    items: any[];
  };
}

interface DeclinedOffer {
  id: string;
  offerNumber: string;
  totalValue: any;
  respondedAt: Date | string | null;
  kit: {
    id: string;
    kitNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    };
    items: any[];
  };
}

const FILTER_TABS = ["all", "needs_return", "label_created", "completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const FILTER_LABELS: Record<FilterTab, string> = {
  all: "All",
  needs_return: "Needs Return",
  label_created: "Ready to Ship",
  completed: "Completed",
};

// Only tabs where admin must act get a gold badge
const ACTION_TABS = new Set<FilterTab>(["needs_return", "label_created"]);

const STATUS_LABELS: Record<string, string> = {
  LABEL_CREATED: "Label Created",
  IN_TRANSIT: "Mark Shipped",
  DELIVERED: "Mark Delivered",
};



export default function ReturnsClient({
  returns,
  declinedOffers,
}: {
  returns: Return[];
  declinedOffers: DeclinedOffer[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: declinedOffers.length + returns.length,
      needs_return: declinedOffers.length,
      label_created: 0, completed: 0,
    };
    for (const r of returns) {
      if (["PENDING", "LABEL_CREATED"].includes(r.status)) counts.label_created++;
      else if (["IN_TRANSIT", "DELIVERED"].includes(r.status)) counts.completed++;
    }
    return counts;
  }, [returns, declinedOffers]);

  const initialFilter = searchParams.get("status");
  const [activeFilter, setActiveFilter] = useState<FilterTab>(
    initialFilter && FILTER_TABS.includes(initialFilter as FilterTab) ? initialFilter as FilterTab : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const matchesSearch = (...fields: string[]) => matchesSearchUtil(searchQuery, ...fields);

  // Filtered declined offers
  const filteredDeclined = declinedOffers.filter((offer) => {
    if (activeFilter !== "all" && activeFilter !== "needs_return") return false;
    const name = `${offer.kit.customer.firstName} ${offer.kit.customer.lastName}`;
    return matchesSearch(name, offer.kit.kitNumber, offer.offerNumber);
  });

  // Filtered returns — tabs group statuses, "All" shows everything
  const filteredReturns = returns.filter((returnItem) => {
    if (activeFilter === "needs_return") return false;
    if (activeFilter === "label_created" && !["PENDING", "LABEL_CREATED"].includes(returnItem.status)) return false;
    if (activeFilter === "completed" && !["IN_TRANSIT", "DELIVERED"].includes(returnItem.status)) return false;
    const name = `${returnItem.kit.customer.firstName} ${returnItem.kit.customer.lastName}`;
    return matchesSearch(name, returnItem.returnNumber, returnItem.kit.kitNumber);
  });

  const handleUpdateStatus = async (returnId: string, newStatus: string) => {
    setUpdatingId(returnId);
    setErrorMsg("");
    try {
      const result = await updateReturnStatus(returnId, newStatus as any);
      if (result.success) {
        setSuccessMsg(`Return status updated successfully`);
        router.refresh();
      } else {
        setErrorMsg(result.error || "Failed to update status");
      }
    } catch {
      setErrorMsg("Failed to update return status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Returns" backHref="/admin" />

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
                  <span className="admin-count-badge" style={{ marginLeft: "6px" }}>{count}</span>
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
            placeholder="Search returns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {successMsg && <div className="admin-alert success">{successMsg}</div>}
        {errorMsg && <div className="admin-alert error">{errorMsg}</div>}

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredDeclined.length === 0 && filteredReturns.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No returns found</div>
              </div>
            </div>
          ) : (
            <>
              {/* Declined offer cards — needs return */}
              {filteredDeclined.map((offer) => (
                <Link
                  key={`offer-${offer.id}`}
                  href={`/admin/requests/${offer.kit.id}?from=returns`}
                  className="admin-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-id">{offer.kit.kitNumber}</div>
                      <div className="admin-card-name">
                        {offer.kit.customer.firstName} {offer.kit.customer.lastName}
                      </div>
                    </div>
                    <span className="admin-badge action-needed">
                      Needs Return
                    </span>
                  </div>
                  <div className="admin-card-meta">
                    {offer.kit.items.length} item{offer.kit.items.length !== 1 ? "s" : ""} &bull; Declined {offer.respondedAt ? formatDate(offer.respondedAt) : ""}
                  </div>
                  <div className="admin-card-footer">
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      {offer.offerNumber}
                    </span>
                    <span style={{ fontSize: "12px", padding: "4px 8px", background: "#AD7B2A", color: "white", borderRadius: "4px", fontWeight: 500 }}>
                      Create Return
                    </span>
                  </div>
                </Link>
              ))}

              {/* Return cards */}
              {filteredReturns.map((returnItem) => {
                const nextStatus = getNextReturnStatus(returnItem.status);
                const isThisUpdating = updatingId === returnItem.id;
                return (
                  <Link key={returnItem.id} href={`/admin/requests/${returnItem.kit.id}?from=returns`} className="admin-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="admin-card-header">
                      <div>
                        <div className="admin-card-id">{returnItem.kit.kitNumber}</div>
                        <div className="admin-card-name">
                          {returnItem.kit.customer.firstName} {returnItem.kit.customer.lastName}
                        </div>
                      </div>
                      <span className={`admin-badge ${getStatusBadgeClass(returnItem.status)}`}>
                        {formatStatus(returnItem.status)}
                      </span>
                    </div>
                    <div className="admin-card-meta">
                      {returnItem.returnNumber} &bull; {returnItem.kit.items.length} items
                      {returnItem.trackingNumber && ` \u2022 ${returnItem.trackingNumber}`}
                    </div>
                    <div className="admin-card-footer">
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>
                        {formatDate(returnItem.deliveredAt || returnItem.shippedAt || returnItem.createdAt)}
                      </span>
                      {nextStatus && (
                        <button
                          className="admin-action-btn"
                          onClick={() => handleUpdateStatus(returnItem.id, nextStatus)}
                          disabled={isThisUpdating}
                        >
                          {isThisUpdating ? "Updating..." : STATUS_LABELS[nextStatus]}
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kit</th>
                <th>Return</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeclined.length === 0 && filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                    No returns found
                  </td>
                </tr>
              ) : (
                <>
                  {/* Declined offer rows */}
                  {filteredDeclined.map((offer) => (
                    <tr key={`offer-${offer.id}`}>
                      <td>
                        <Link href={`/admin/requests/${offer.kit.id}?from=returns`} className="admin-table-link">
                          {offer.kit.kitNumber}
                        </Link>
                      </td>
                      <td style={{ color: "#6B7280", fontStyle: "italic" }}>—</td>
                      <td>{offer.kit.customer.firstName} {offer.kit.customer.lastName}</td>
                      <td>{offer.kit.items.length} items</td>
                      <td>
                        <span className="admin-badge action-needed">
                          Needs Return
                        </span>
                      </td>
                      <td>—</td>
                      <td>
                        <Link href={`/admin/requests/${offer.kit.id}?from=returns`} className="admin-table-link" style={{ fontWeight: 500 }}>
                          Create Return
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {/* Return rows */}
                  {filteredReturns.map((returnItem) => {
                    const nextStatus = getNextReturnStatus(returnItem.status);
                    const isThisUpdating = updatingId === returnItem.id;
                    return (
                      <tr key={returnItem.id}>
                        <td>
                          <Link href={`/admin/requests/${returnItem.kit.id}?from=returns`} className="admin-table-link">
                            {returnItem.kit.kitNumber}
                          </Link>
                        </td>
                        <td>{returnItem.returnNumber}</td>
                        <td>{returnItem.kit.customer.firstName} {returnItem.kit.customer.lastName}</td>
                        <td>{returnItem.kit.items.length} items</td>
                        <td>
                          <span className={`admin-badge ${getStatusBadgeClass(returnItem.status)}`}>
                            {formatStatus(returnItem.status)}
                          </span>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                          {returnItem.trackingNumber || "-"}
                        </td>
                        <td>
                          {nextStatus && (
                            <button
                              onClick={() => handleUpdateStatus(returnItem.id, nextStatus)}
                              disabled={isThisUpdating}
                              className="admin-table-link"
                              style={{ cursor: isThisUpdating ? "default" : "pointer" }}
                            >
                              {isThisUpdating ? "..." : STATUS_LABELS[nextStatus]}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
