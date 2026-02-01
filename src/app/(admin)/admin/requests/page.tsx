"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";

// Mock data for requests
const requests = [
  {
    id: "r101",
    displayId: "#101",
    customer: "John Doe",
    kitType: "digital",
    status: "pending",
    date: "Jan 10, 2025",
    value: null,
    info: "Awaiting action",
  },
  {
    id: "r100",
    displayId: "#100",
    customer: "Jane Smith",
    kitType: "physical",
    status: "kit sent",
    date: "Jan 9, 2025",
    value: null,
    info: "Tracking: USPS1234567890",
  },
  {
    id: "r099",
    displayId: "#099",
    customer: "Bob Wilson",
    kitType: "digital",
    status: "received",
    date: "Jan 8, 2025",
    value: null,
    info: "Ready for evaluation",
  },
  {
    id: "r098",
    displayId: "#098",
    customer: "Mary Johnson",
    kitType: "digital",
    status: "evaluating",
    date: "Jan 7, 2025",
    value: "$767.15",
    info: "2 items logged",
  },
  {
    id: "r097",
    displayId: "#097",
    customer: "David Brown",
    kitType: "physical",
    status: "offer sent",
    date: "Jan 5, 2025",
    value: "$384.98",
    info: null,
  },
  {
    id: "r096",
    displayId: "#096",
    customer: "John Doe",
    kitType: "digital",
    status: "accepted",
    date: "Jan 2, 2025",
    value: "$3,607.60",
    info: null,
  },
  {
    id: "r092",
    displayId: "#092",
    customer: "David Brown",
    kitType: "digital",
    status: "in transit",
    date: "Jan 9, 2025",
    value: null,
    info: "Tracking: USPS2222333344",
  },
];

const filterTabs = ["all", "digital", "physical", "pending", "received"];

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
    case "offer sent":
      return "pending";
    case "received":
    case "evaluating":
    case "in transit":
      return "in-progress";
    case "accepted":
      return "success";
    case "kit sent":
      return "purple";
    default:
      return "gray";
  }
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(" ", " ");
}

export default function RequestsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter((request) => {
    const matchesFilter =
      activeFilter === "all" ||
      request.kitType === activeFilter ||
      request.status === activeFilter;
    const matchesSearch =
      request.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.displayId.toLowerCase().includes(searchQuery.toLowerCase());
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
          {filteredRequests.map((request) => (
            <Link
              key={request.id}
              href={`/admin/requests/${request.id}`}
              className="admin-card"
            >
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-id">{request.displayId}</div>
                  <div className="admin-card-name">{request.customer}</div>
                </div>
                <span className={`admin-badge ${getStatusBadgeClass(request.status)}`}>
                  {formatStatus(request.status)}
                </span>
              </div>
              <div className="admin-card-meta">
                {request.kitType.charAt(0).toUpperCase() + request.kitType.slice(1)} Kit &bull; {request.date}
              </div>
              <div className="admin-card-footer">
                <span style={{ fontSize: "12px", color: request.value ? "#AD7B2A" : "#6B7280", fontWeight: request.value ? 500 : 400 }}>
                  {request.value || request.info}
                </span>
                <svg className="admin-card-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
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
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link href={`/admin/requests/${request.id}`} className="admin-table-link">
                      {request.displayId}
                    </Link>
                  </td>
                  <td>{request.customer}</td>
                  <td>{request.kitType.charAt(0).toUpperCase() + request.kitType.slice(1)}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(request.status)}`}>
                      {formatStatus(request.status)}
                    </span>
                  </td>
                  <td>{request.date}</td>
                  <td>{request.value || "-"}</td>
                  <td>
                    <Link href={`/admin/requests/${request.id}`} className="admin-table-link">
                      View
                    </Link>
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
