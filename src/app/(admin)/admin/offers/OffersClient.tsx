"use client";

import Link from "next/link";
import { useState } from "react";
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

const filterTabs = ["all", "draft", "sent", "accepted", "declined", "expired"];

export default function OffersClient({ offers }: { offers: Offer[] }) {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("status") || "all";
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOffers = offers.filter((offer) => {
    const statusLower = offer.status.toLowerCase();
    const matchesFilter = activeFilter === "all" || statusLower === activeFilter;

    const customerName = `${offer.kit.customer.firstName} ${offer.kit.customer.lastName}`.toLowerCase();
    const matchesSearch =
      customerName.includes(searchQuery.toLowerCase()) ||
      offer.offerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.kit.kitNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Offers" backHref="/admin" />

        {/* Filter Tabs */}
        <div className="admin-filter-tabs">
          {filterTabs.map((tab) => {
            const count = tab === "all"
              ? offers.length
              : offers.filter((o) => o.status.toLowerCase() === tab).length;
            return (
              <button
                key={tab}
                className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredOffers.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No offers found</div>
              </div>
            </div>
          ) : (
            filteredOffers.map((offer) => (
              <Link
                key={offer.id}
                href={`/admin/offers/${offer.id}`}
                className="admin-card"
              >
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-id">{offer.offerNumber}</div>
                    <div className="admin-card-name">
                      {offer.kit.customer.firstName} {offer.kit.customer.lastName}
                    </div>
                  </div>
                  <span className={`admin-badge ${getStatusBadgeClass(offer.status)}`}>
                    {formatStatus(offer.status)}
                  </span>
                </div>
                <div className="admin-card-meta">
                  Kit {offer.kit.kitNumber} &bull;{" "}
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
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offer ID</th>
                <th>Customer</th>
                <th>Kit</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                    No offers found
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td>
                      <Link href={`/admin/offers/${offer.id}`} className="admin-table-link">
                        {offer.offerNumber}
                      </Link>
                    </td>
                    <td>{offer.kit.customer.firstName} {offer.kit.customer.lastName}</td>
                    <td>{offer.kit.kitNumber}</td>
                    <td>{formatCurrency(parseFloat(offer.totalValue.toString()))}</td>
                    <td>
                      <span className={`admin-badge ${getStatusBadgeClass(offer.status)}`}>
                        {formatStatus(offer.status)}
                      </span>
                    </td>
                    <td>{offer.sentAt ? formatDate(offer.sentAt) : "—"}</td>
                    <td>{offer.status === "DRAFT" ? "—" : formatDate(offer.expiresAt)}</td>
                    <td>
                      <Link href={`/admin/offers/${offer.id}`} className="admin-table-link">
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
