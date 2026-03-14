"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const STATUS_LABELS: Record<string, string> = {
  LABEL_CREATED: "Label Created",
  IN_TRANSIT: "Mark Shipped",
  DELIVERED: "Mark Delivered",
};

function getNextStatus(current: string): string | null {
  switch (current) {
    case "PENDING": return "LABEL_CREATED";
    case "LABEL_CREATED": return "IN_TRANSIT";
    case "IN_TRANSIT": return "DELIVERED";
    default: return null;
  }
}

function ActionButton({
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
        background: disabled ? "#D1C4A9" : "#AD7B2A",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {disabled ? "Updating..." : label}
    </button>
  );
}

export default function ReturnsClient({ returns }: { returns: Return[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("status") || "all";
  const [activeFilter, setActiveFilter] = useState(initialFilter);
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
          {filterTabs.map((tab) => {
            const count = tab === "all"
              ? returns.length
              : returns.filter((r) => r.status.toLowerCase() === tab).length;
            return (
              <button
                key={tab}
                className={`admin-filter-tab ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {formatStatus(tab)}
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
            placeholder="Search returns..."
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
          {filteredReturns.length === 0 ? (
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-name">No returns found</div>
              </div>
            </div>
          ) : (
            filteredReturns.map((returnItem) => {
              const nextStatus = getNextStatus(returnItem.status);
              const isThisUpdating = updatingId === returnItem.id;
              return (
                <div key={returnItem.id} className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <Link href={`/admin/returns/${returnItem.id}`} style={{ color: "#AD7B2A", textDecoration: "none", fontWeight: 600 }}>
                        <div className="admin-card-id">{returnItem.returnNumber}</div>
                      </Link>
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
                    {returnItem.trackingNumber && ` \u2022 ${returnItem.trackingNumber}`}
                  </div>
                  <div className="admin-card-footer">
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      {formatDate(returnItem.deliveredAt || returnItem.shippedAt || returnItem.createdAt)}
                    </span>
                    {nextStatus && (
                      <ActionButton
                        label={STATUS_LABELS[nextStatus]}
                        onClick={() => handleUpdateStatus(returnItem.id, nextStatus)}
                        disabled={isThisUpdating}
                      />
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
                filteredReturns.map((returnItem) => {
                  const nextStatus = getNextStatus(returnItem.status);
                  const isThisUpdating = updatingId === returnItem.id;
                  return (
                    <tr key={returnItem.id}>
                      <td>
                        <Link href={`/admin/returns/${returnItem.id}`} className="admin-table-link">
                          {returnItem.returnNumber}
                        </Link>
                      </td>
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
