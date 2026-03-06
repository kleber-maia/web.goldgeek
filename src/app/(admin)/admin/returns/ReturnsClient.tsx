"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
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

const filterTabs = ["all", "pending", "label_created", "in_transit", "delivered"];

function MobileActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: "12px",
        padding: "4px 8px",
        background: "#AD7B2A",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function ReturnsClient({ returns }: { returns: Return[] }) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredReturns = returns.filter((returnItem) => {
    const statusLower = returnItem.status.toLowerCase();
    const matchesFilter = activeFilter === "all" || statusLower === activeFilter;

    const customerName = `${returnItem.kit.customer.firstName} ${returnItem.kit.customer.lastName}`.toLowerCase();
    const matchesSearch =
      customerName.includes(searchQuery.toLowerCase()) ||
      returnItem.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.kit.kitNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = async (returnId: string, newStatus: string) => {
    setIsUpdating(true);
    setErrorMsg("");
    try {
      const result = await updateReturnStatus(returnId, newStatus);
      if (result.success) {
        router.refresh();
      } else {
        setErrorMsg(result.error || "Failed to update status");
      }
    } catch {
      setErrorMsg("Failed to update return status");
    } finally {
      setIsUpdating(false);
    }
  };

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
              {formatStatus(tab)}
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
            placeholder="Search returns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {errorMsg && (
          <div style={{ padding: "12px 16px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {errorMsg}
          </div>
        )}

        {/* Mobile Card List */}
        <div className="admin-card-list">
          {filteredReturns.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No returns found</div>
              </div>
            </div>
          ) : (
            filteredReturns.map((returnItem) => (
              <div key={returnItem.id} className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-id">{returnItem.returnNumber}</div>
                    <div className="admin-card-name">
                      {returnItem.kit.customer.firstName} {returnItem.kit.customer.lastName}
                    </div>
                  </div>
                  <span className={`admin-badge ${getStatusBadgeClass(returnItem.status)}`}>
                    {formatStatus(returnItem.status)}
                  </span>
                </div>
                <div className="admin-card-meta">
                  <Link href={`/admin/requests/${returnItem.kit.id}`} style={{ color: "#AD7B2A" }}>
                    {returnItem.kit.kitNumber}
                  </Link>{" "}
                  &bull; {returnItem.kit.items.length} items
                  {returnItem.trackingNumber && ` • ${returnItem.trackingNumber}`}
                </div>
                <div className="admin-card-footer">
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>
                    {formatDate(returnItem.deliveredAt || returnItem.shippedAt || returnItem.createdAt)}
                  </span>
                  {returnItem.status === "PENDING" && (
                    <MobileActionButton label="Label Created" onClick={() => handleUpdateStatus(returnItem.id, "LABEL_CREATED")} disabled={isUpdating} />
                  )}
                  {returnItem.status === "LABEL_CREATED" && (
                    <MobileActionButton label="Mark Shipped" onClick={() => handleUpdateStatus(returnItem.id, "IN_TRANSIT")} disabled={isUpdating} />
                  )}
                  {returnItem.status === "IN_TRANSIT" && (
                    <MobileActionButton label="Mark Delivered" onClick={() => handleUpdateStatus(returnItem.id, "DELIVERED")} disabled={isUpdating} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Customer</th>
                <th>Kit</th>
                <th>Items</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                    No returns found
                  </td>
                </tr>
              ) : (
                filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id}>
                    <td>{returnItem.returnNumber}</td>
                    <td>{returnItem.kit.customer.firstName} {returnItem.kit.customer.lastName}</td>
                    <td>
                      <Link href={`/admin/requests/${returnItem.kit.id}`} className="admin-table-link">
                        {returnItem.kit.kitNumber}
                      </Link>
                    </td>
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
                      {returnItem.status === "PENDING" && (
                        <button onClick={() => handleUpdateStatus(returnItem.id, "LABEL_CREATED")} disabled={isUpdating} className="admin-table-link" style={{ cursor: "pointer" }}>
                          Label Created
                        </button>
                      )}
                      {returnItem.status === "LABEL_CREATED" && (
                        <button onClick={() => handleUpdateStatus(returnItem.id, "IN_TRANSIT")} disabled={isUpdating} className="admin-table-link" style={{ cursor: "pointer" }}>
                          Mark Shipped
                        </button>
                      )}
                      {returnItem.status === "IN_TRANSIT" && (
                        <button onClick={() => handleUpdateStatus(returnItem.id, "DELIVERED")} disabled={isUpdating} className="admin-table-link" style={{ cursor: "pointer" }}>
                          Mark Delivered
                        </button>
                      )}
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
