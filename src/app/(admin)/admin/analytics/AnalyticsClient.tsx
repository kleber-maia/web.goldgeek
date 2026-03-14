"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { formatCurrency } from "@/lib/db/utils";
import { formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import type { AnalyticsData } from "@/lib/actions/admin/analytics.actions";

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      padding: "16px",
      textAlign: "center",
    }}>
      <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ margin: "0", fontSize: "24px", fontWeight: 700, color: "#AD7B2A" }}>{value}</p>
      {detail && <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9CA3AF" }}>{detail}</p>}
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, color = "#AD7B2A" }: { data: any[]; labelKey: string; valueKey: string; color?: string }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "#6B7280" }}>
            {valueKey === "revenue" ? `$${Math.round(item[valueKey])}` : item[valueKey]}
          </span>
          <div
            style={{
              width: "100%",
              maxWidth: "40px",
              height: `${Math.max((item[valueKey] / max) * 80, 4)}px`,
              background: color,
              borderRadius: "4px 4px 0 0",
            }}
          />
          <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{item[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsClient({ data }: { data: AnalyticsData | null }) {
  if (!data) {
    return (
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-main">
          <AdminHeader title="Analytics" backHref="/admin" />
          <p style={{ textAlign: "center", color: "#6B7280", padding: "40px" }}>Failed to load analytics data.</p>
        </main>
        <AdminBottomNav />
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Analytics" backHref="/admin" />

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          <StatCard label="Total Kits" value={String(data.summary.totalKits)} detail={`${data.summary.activeKits} active`} />
          <StatCard label="Revenue" value={formatCurrency(data.summary.totalRevenue)} />
          <StatCard label="Conversion" value={`${data.summary.conversionRate}%`} detail="offers → paid" />
          <StatCard label="Avg Processing" value={`${data.summary.avgProcessingDays}d`} detail="received → complete" />
          <StatCard label="Pending Payments" value={String(data.summary.pendingPayments)} />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px", gridColumn: "span 1" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Kit Volume (6 mo)</h3>
            <BarChart data={data.kitsByMonth} labelKey="month" valueKey="count" />
          </div>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px", gridColumn: "span 1" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Revenue (6 mo)</h3>
            <BarChart data={data.revenueByMonth} labelKey="month" valueKey="revenue" color="#10B981" />
          </div>
        </div>

        {/* Kits by Status */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Kits by Status</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {data.kitsByStatus.map((item) => (
              <div key={item.status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className={`admin-badge ${getStatusBadgeClass(item.status)}`}>
                  {formatStatus(item.status)}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Top Customers</h3>
          <div className="admin-table-wrapper" style={{ margin: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Kits</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>{c.email}</div>
                    </td>
                    <td>{c.kitCount}</td>
                    <td style={{ color: "#AD7B2A", fontWeight: 500 }}>{formatCurrency(c.totalValue)}</td>
                  </tr>
                ))}
                {data.topCustomers.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "#6B7280" }}>No data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
