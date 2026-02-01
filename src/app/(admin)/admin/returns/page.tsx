"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";

// Mock data for returns
const returns = [
  {
    id: "ret1",
    displayId: "Return #RET1",
    customer: "Bob Wilson",
    requestId: "r094",
    requestDisplayId: "#094",
    items: "1 item - Gold plated watch",
    status: "pending",
    declinedDate: "Dec 31, 2024",
    tracking: null,
    deliveredDate: null,
  },
  {
    id: "ret2",
    displayId: "Return #RET2",
    customer: "Mary Johnson",
    requestId: "r093",
    requestDisplayId: "#093",
    items: "2 items",
    status: "completed",
    declinedDate: "Dec 29, 2024",
    tracking: "USPS9999000011",
    deliveredDate: "Jan 3, 2025",
  },
];

const filterTabs = ["All", "Pending", "Shipped", "Completed"];

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return "pending";
    case "shipped":
      return "in-progress";
    case "completed":
      return "success";
    default:
      return "gray";
  }
}

export default function ReturnsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredReturns = returns.filter((ret) =>
    activeFilter === "All" || ret.status === activeFilter.toLowerCase()
  );

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Returns" backHref="/admin" />

        {/* Filter Tabs */}
        <div className="admin-filter-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Returns Cards (Mobile) */}
        <div className="admin-card-list">
          {filteredReturns.map((ret) => (
            <div key={ret.id} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-id">{ret.displayId}</div>
                  <div className="admin-card-name">{ret.customer}</div>
                </div>
                <span className={`admin-badge ${getStatusBadgeClass(ret.status)}`}>
                  {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                </span>
              </div>
              <div className="admin-card-meta">Request {ret.requestDisplayId} &bull; Declined {ret.declinedDate}</div>
              <div className="admin-card-footer">
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  {ret.deliveredDate ? `Delivered ${ret.deliveredDate}` : ret.items}
                </span>
                {ret.status === "pending" ? (
                  <button className="admin-btn admin-btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                    </svg>
                    Print Label
                  </button>
                ) : (
                  <span style={{ fontSize: "12px", color: "#10B981" }}>Tracking: {ret.tracking}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Customer</th>
                <th>Request</th>
                <th>Items</th>
                <th>Status</th>
                <th>Tracking</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr key={ret.id}>
                  <td>{ret.displayId.replace("Return ", "")}</td>
                  <td>{ret.customer}</td>
                  <td>
                    <Link href={`/admin/requests/${ret.requestId}`} className="admin-table-link">
                      {ret.requestDisplayId}
                    </Link>
                  </td>
                  <td>{ret.items}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(ret.status)}`}>
                      {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                    </span>
                  </td>
                  <td>{ret.tracking || "-"}</td>
                  <td>
                    {ret.status === "pending" ? (
                      <button className="admin-btn admin-btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                        Print Label
                      </button>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>{ret.deliveredDate}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
