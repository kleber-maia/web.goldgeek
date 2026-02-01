"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";

// Mock data for offers
const offers = [
  {
    id: "o1",
    displayId: "Offer #O1",
    customer: "David Brown",
    requestId: "#097",
    amount: "$384.98",
    status: "pending",
    sentDate: "Jan 10, 2025",
    expiresDate: "Jan 17",
    paymentStatus: null,
  },
  {
    id: "o2",
    displayId: "Offer #O2",
    customer: "John Doe",
    requestId: "#096",
    amount: "$3,607.60",
    status: "accepted",
    sentDate: "Jan 6, 2025",
    expiresDate: null,
    paymentStatus: "Payment pending",
  },
  {
    id: "o3",
    displayId: "Offer #O3",
    customer: "Jane Smith",
    requestId: "#095",
    amount: "$1,852.15",
    status: "accepted",
    sentDate: "Jan 3, 2025",
    expiresDate: null,
    paymentStatus: "Paid",
  },
  {
    id: "o4",
    displayId: "Offer #O4",
    customer: "Bob Wilson",
    requestId: "#094",
    amount: "$85.00",
    status: "declined",
    sentDate: "Dec 31, 2024",
    expiresDate: null,
    paymentStatus: "Return pending",
  },
];

const filterTabs = ["All", "Pending", "Accepted", "Declined"];

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return "pending";
    case "accepted":
      return "success";
    case "declined":
      return "error";
    default:
      return "gray";
  }
}

export default function OffersPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOffers = offers.filter((offer) => {
    const matchesFilter =
      activeFilter === "All" ||
      offer.status === activeFilter.toLowerCase();
    const matchesSearch =
      offer.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.displayId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Offers" backHref="/admin" />

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

        {/* Offers Cards (Mobile) */}
        <div className="admin-card-list">
          {filteredOffers.map((offer) => (
            <Link key={offer.id} href={`/admin/offers/${offer.id}`} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-id">{offer.displayId}</div>
                  <div className="admin-card-name">{offer.customer}</div>
                </div>
                <span className={`admin-badge ${getStatusBadgeClass(offer.status)}`}>
                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </span>
              </div>
              <div className="admin-card-meta">Request {offer.requestId} &bull; Sent {offer.sentDate}</div>
              <div className="admin-card-footer">
                <span style={{ fontSize: "16px", fontWeight: 600, color: offer.status === "declined" ? "#6B7280" : "#AD7B2A" }}>
                  {offer.amount}
                </span>
                <span style={{ fontSize: "12px", color: offer.paymentStatus === "Paid" ? "#10B981" : offer.paymentStatus === "Return pending" ? "#EF4444" : "#6B7280" }}>
                  {offer.expiresDate ? `Expires ${offer.expiresDate}` : offer.paymentStatus}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer ID</th>
                <th>Customer</th>
                <th>Request</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Sent</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map((offer) => (
                <tr key={offer.id}>
                  <td>{offer.displayId.replace("Offer ", "")}</td>
                  <td>{offer.customer}</td>
                  <td>
                    <Link href={`/admin/requests/r${offer.requestId.replace("#", "")}`} className="admin-table-link">
                      {offer.requestId}
                    </Link>
                  </td>
                  <td>{offer.amount}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(offer.status)}`}>
                      {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                    </span>
                  </td>
                  <td>{offer.sentDate}</td>
                  <td>
                    <Link href={`/admin/offers/${offer.id}`} className="admin-table-link">
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
