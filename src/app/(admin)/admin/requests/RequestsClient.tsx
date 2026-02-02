"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatCurrency } from "@/lib/db/utils";

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
    user: {
      email: string;
    };
  };
  items: any[];
}

const filterTabs = ["all", "digital", "physical", "pending", "received"];

function getStatusBadgeClass(status: string): string {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "pending":
    case "offer_sent":
      return "pending";
    case "received":
    case "evaluating":
    case "in_transit":
      return "in-progress";
    case "accepted":
    case "paid":
      return "success";
    case "kit_sent":
      return "purple";
    default:
      return "gray";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RequestsClient({ kits }: { kits: Kit[] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredKits = kits.filter((kit) => {
    const kitTypeLower = kit.type.toLowerCase();
    const statusLower = kit.status.toLowerCase();

    const matchesFilter =
      activeFilter === "all" ||
      kitTypeLower === activeFilter ||
      statusLower === activeFilter;

    const customerName = `${kit.customer.firstName} ${kit.customer.lastName}`.toLowerCase();
    const matchesSearch =
      customerName.includes(searchQuery.toLowerCase()) ||
      kit.kitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.customer.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader
          title="Kit Requests"
          backHref="/admin"
          rightAction={
            <button className="admin-menu-btn" style={{ color: "#AD7B2A" }}>
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          }
        />

        {/* Filter Tabs */}
        <div className="admin-filter-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
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
                  <span style={{ fontSize: "12px", color: kit.estimatedValue ? "#AD7B2A" : "#6B7280", fontWeight: kit.estimatedValue ? 500 : 400 }}>
                    {kit.estimatedValue ? formatCurrency(parseFloat(kit.estimatedValue.toString())) : `${kit.items.length} items`}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredKits.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
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
                      {kit.estimatedValue
                        ? formatCurrency(parseFloat(kit.estimatedValue.toString()))
                        : "-"}
                    </td>
                    <td>
                      <Link href={`/admin/requests/${kit.id}`} className="admin-table-link">
                        View
                      </Link>
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
