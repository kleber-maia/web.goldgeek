"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import { generateCSV, downloadCSV } from "@/lib/export/csv";

interface Kit {
  id: string;
  kitNumber: string;
  type: string;
  status: string;
  createdAt: Date | string;
  estimatedValue: any;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    finalValue?: string | null;
    estimatedValue?: string | null;
  }>;
}

function getKitValue(kit: Kit): number | null {
  if (kit.estimatedValue) return parseFloat(kit.estimatedValue.toString());
  if (kit.items.length === 0) return null;
  const total = kit.items.reduce((sum, item) => {
    const val = item.finalValue || item.estimatedValue;
    return sum + (val ? parseFloat(val.toString()) : 0);
  }, 0);
  return total > 0 ? total : null;
}

// Intake funnel tabs — kits only appear here during intake phase
const FILTER_TABS = ["all", "new_requests", "shipped", "completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const FILTER_LABELS: Record<FilterTab, string> = {
  all: "All",
  new_requests: "New Requests",
  shipped: "Shipped",
  completed: "Completed",
};

// Intake-phase statuses (everything else lives on Offers/Payments/Returns pages)
const INTAKE_STATUSES = new Set(["PENDING", "SHIPPED"]);

// Only tabs where admin must act get a gold badge
const ACTION_TABS = new Set<FilterTab>(["new_requests"]);

function getFilterTab(status: string): FilterTab {
  if (status === "PENDING") return "new_requests";
  if (status === "SHIPPED") return "shipped";
  return "completed";
}

export default function RequestsClient({ kits }: { kits: Kit[] }) {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("status");

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: kits.length, new_requests: 0, shipped: 0, completed: 0 };
    for (const kit of kits) {
      const tab = getFilterTab(kit.status);
      if (tab) counts[tab]++;
    }
    return counts;
  }, [kits]);

  const [activeFilter, setActiveFilter] = useState<FilterTab>(
    initialFilter && FILTER_TABS.includes(initialFilter as FilterTab) ? initialFilter as FilterTab : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredKits = kits.filter((kit) => {
    const tab = getFilterTab(kit.status);
    const matchesFilter = activeFilter === "all" || tab === activeFilter;

    const customerName = `${kit.customer.firstName} ${kit.customer.lastName}`.toLowerCase();
    const matchesSearch =
      customerName.includes(searchQuery.toLowerCase()) ||
      kit.kitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader
          title="Kit Requests"
          backHref="/admin"
        />

        {/* Filter Tabs + Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", overflow: "hidden" }}>
          <div className="admin-filter-tabs" style={{ marginBottom: 0, flex: 1, minWidth: 0 }}>
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
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <Link
              href="/admin/requests/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#AD7B2A",
                color: "#fff",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              + New Request
            </Link>
            <button
              onClick={() => {
                const csv = generateCSV(filteredKits, [
                  { key: "kitNumber", label: "Kit ID" },
                  { key: "customer.firstName", label: "First Name" },
                  { key: "customer.lastName", label: "Last Name" },
                  { key: "customer.email", label: "Email" },
                  { key: "type", label: "Kit Type" },
                  { key: "status", label: "Status", format: (v: string) => formatStatus(v) },
                  { key: "createdAt", label: "Date", format: (v: any) => formatDate(v) },
                  { key: "estimatedValue", label: "Value", format: (v: any) => v ? `$${parseFloat(v).toFixed(2)}` : "" },
                ]);
                downloadCSV(csv, `kit-requests-${new Date().toISOString().slice(0, 10)}.csv`);
              }}
              style={{
                padding: "8px 14px",
                background: "#fff",
                color: "#2E1F0C",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="admin-search-wrapper">
          <svg className="admin-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="admin-search"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredKits.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No requests found</div>
              </div>
            </div>
          ) : (
            filteredKits.map((kit) => (
              <Link
                key={kit.id}
                href={`/admin/requests/${kit.id}`}
                className="admin-card"
              >
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-id">{kit.kitNumber}</div>
                    <div className="admin-card-name">
                      {kit.customer.firstName} {kit.customer.lastName}
                    </div>
                  </div>
                  <span className={`admin-badge ${getStatusBadgeClass(kit.status)}`}>
                    {formatStatus(kit.status)}
                  </span>
                </div>
                <div className="admin-card-meta">
                  {kit.type.charAt(0).toUpperCase() + kit.type.slice(1)} Kit &bull; {formatDate(kit.createdAt)}
                </div>
                <div className="admin-card-footer">
                  <span style={{ fontSize: "12px", color: getKitValue(kit) ? "#AD7B2A" : "#6B7280", fontWeight: getKitValue(kit) ? 500 : 400 }}>
                    {(() => {
                      const value = getKitValue(kit);
                      return value ? formatCurrency(value) : `${kit.items.length} items`;
                    })()}
                  </span>
                  <svg className="admin-card-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Kit Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredKits.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredKits.map((kit) => (
                  <tr key={kit.id}>
                    <td>
                      <Link href={`/admin/requests/${kit.id}`} className="admin-table-link">
                        {kit.kitNumber}
                      </Link>
                    </td>
                    <td>{kit.customer.firstName} {kit.customer.lastName}</td>
                    <td>{kit.type.charAt(0).toUpperCase() + kit.type.slice(1)}</td>
                    <td>
                      <span className={`admin-badge ${getStatusBadgeClass(kit.status)}`}>
                        {formatStatus(kit.status)}
                      </span>
                    </td>
                    <td>{formatDate(kit.createdAt)}</td>
                    <td>
                      {(() => {
                        const value = getKitValue(kit);
                        return value ? formatCurrency(value) : "-";
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
