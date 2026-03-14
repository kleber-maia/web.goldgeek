"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import { voidShippingLabel } from "@/lib/actions/admin/shipping.actions";

interface ShippingLabel {
  id: string;
  type: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  cost: any;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  voidedAt: string | null;
  kit: {
    id: string;
    kitNumber: string;
    customer: {
      firstName: string;
      lastName: string;
    };
  };
}

type FilterTab = "all" | "inbound" | "kit_delivery" | "return" | "voided";

const filterTabs: FilterTab[] = ["all", "inbound", "kit_delivery", "return", "voided"];

const FILTER_LABELS: Record<FilterTab, string> = {
  all: "All",
  inbound: "Inbound",
  kit_delivery: "Kit Delivery",
  return: "Return",
  voided: "Voided",
};

function formatType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCost(cost: any): string {
  if (cost === null || cost === undefined) return "-";
  const num = parseFloat(cost.toString());
  if (isNaN(num)) return "-";
  return `$${num.toFixed(2)}`;
}

export default function ShippingClient({ labels }: { labels: ShippingLabel[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("tab") as FilterTab) || "all";
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const filteredLabels = labels.filter((label) => {
    // Filter by tab
    let matchesFilter = true;
    if (activeFilter === "inbound") {
      matchesFilter = label.type === "INBOUND";
    } else if (activeFilter === "kit_delivery") {
      matchesFilter = label.type === "KIT_DELIVERY";
    } else if (activeFilter === "return") {
      matchesFilter = label.type === "RETURN";
    } else if (activeFilter === "voided") {
      matchesFilter = label.status === "VOIDED";
    }

    // Search by tracking number or kit number
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      label.trackingNumber.toLowerCase().includes(query) ||
      label.kit.kitNumber.toLowerCase().includes(query) ||
      `${label.kit.customer.firstName} ${label.kit.customer.lastName}`.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const getTabCount = (tab: FilterTab): number => {
    if (tab === "all") return labels.length;
    if (tab === "inbound") return labels.filter((l) => l.type === "INBOUND").length;
    if (tab === "kit_delivery") return labels.filter((l) => l.type === "KIT_DELIVERY").length;
    if (tab === "return") return labels.filter((l) => l.type === "RETURN").length;
    if (tab === "voided") return labels.filter((l) => l.status === "VOIDED").length;
    return 0;
  };

  const handleVoid = async (labelId: string) => {
    if (!confirm("Are you sure you want to void this shipping label? This action cannot be undone.")) {
      return;
    }

    setVoidingId(labelId);
    setErrorMsg("");
    try {
      const result = await voidShippingLabel(labelId);
      if (result.success) {
        setSuccessMsg("Shipping label voided successfully");
        router.refresh();
      } else {
        setErrorMsg(result.error || "Failed to void shipping label");
      }
    } catch {
      setErrorMsg("Failed to void shipping label");
    } finally {
      setVoidingId(null);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Shipping Labels" backHref="/admin" />

        {/* Filter Tabs */}
        <div className="admin-filter-tabs">
          {filterTabs.map((tab) => {
            const count = getTabCount(tab);
            return (
              <button
                key={tab}
                className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {FILTER_LABELS[tab]}
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
            placeholder="Search by tracking or kit number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {successMsg && (
          <div style={{ padding: "12px 16px", background: "#D1FAE5", color: "#065F46", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: "12px 16px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {errorMsg}
          </div>
        )}

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredLabels.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No shipping labels found</div>
              </div>
            </div>
          ) : (
            filteredLabels.map((label) => {
              const isVoiding = voidingId === label.id;
              const isVoided = label.status === "VOIDED";
              return (
                <div key={label.id} className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <div className="admin-card-id" style={{ fontFamily: "monospace", fontSize: "13px" }}>
                        {label.trackingNumber}
                      </div>
                      <div className="admin-card-name">
                        {label.kit.customer.firstName} {label.kit.customer.lastName}
                      </div>
                    </div>
                    <span className={`admin-badge ${getStatusBadgeClass(label.status)}`}>
                      {formatStatus(label.status)}
                    </span>
                  </div>
                  <div className="admin-card-meta">
                    <span className={`admin-badge ${getStatusBadgeClass(label.type === "RETURN" ? "RETURNED" : label.type === "INBOUND" ? "IN_TRANSIT" : "PENDING")}`} style={{ marginRight: "6px" }}>
                      {formatType(label.type)}
                    </span>
                    {label.carrier} &bull;{" "}
                    <Link href={`/admin/requests/${label.kit.id}`} style={{ color: "#AD7B2A" }}>
                      {label.kit.kitNumber}
                    </Link>
                    {label.cost !== null && label.cost !== undefined && ` \u2022 ${formatCost(label.cost)}`}
                  </div>
                  <div className="admin-card-footer">
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      {formatDate(label.deliveredAt || label.shippedAt || label.createdAt)}
                    </span>
                    {!isVoided && (
                      <button
                        onClick={() => handleVoid(label.id)}
                        disabled={isVoiding}
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: isVoiding ? "#D1C4A9" : "#DC2626",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isVoiding ? "default" : "pointer",
                          opacity: isVoiding ? 0.7 : 1,
                        }}
                      >
                        {isVoiding ? "Voiding..." : "Void"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Customer</th>
                <th>Kit</th>
                <th>Type</th>
                <th>Carrier</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabels.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>
                    No shipping labels found
                  </td>
                </tr>
              ) : (
                filteredLabels.map((label) => {
                  const isVoiding = voidingId === label.id;
                  const isVoided = label.status === "VOIDED";
                  return (
                    <tr key={label.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                        {label.trackingNumber}
                      </td>
                      <td>
                        {label.kit.customer.firstName} {label.kit.customer.lastName}
                      </td>
                      <td>
                        <Link href={`/admin/requests/${label.kit.id}`} className="admin-table-link">
                          {label.kit.kitNumber}
                        </Link>
                      </td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(label.type === "RETURN" ? "RETURNED" : label.type === "INBOUND" ? "IN_TRANSIT" : "PENDING")}`}>
                          {formatType(label.type)}
                        </span>
                      </td>
                      <td>{label.carrier}</td>
                      <td>
                        <span className={`admin-badge ${getStatusBadgeClass(label.status)}`}>
                          {formatStatus(label.status)}
                        </span>
                      </td>
                      <td>{formatCost(label.cost)}</td>
                      <td>{formatDate(label.deliveredAt || label.shippedAt || label.createdAt)}</td>
                      <td>
                        {!isVoided ? (
                          <button
                            onClick={() => handleVoid(label.id)}
                            disabled={isVoiding}
                            className="admin-table-link"
                            style={{
                              cursor: isVoiding ? "default" : "pointer",
                              color: "#DC2626",
                            }}
                          >
                            {isVoiding ? "..." : "Void"}
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                            {label.voidedAt ? formatDate(label.voidedAt) : "Voided"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
