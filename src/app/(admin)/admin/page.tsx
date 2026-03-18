import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { formatCurrency } from "@/lib/db/utils";
import { getAnalytics } from "@/lib/actions/admin/analytics.actions";
import { formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const analyticsResult = await getAnalytics();
  const analytics = analyticsResult.success ? analyticsResult.data! : null;

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Admin" />

        {/* Quick Actions */}
        <div className="admin-quick-actions">
          <Link href="/admin/requests" className="admin-quick-action">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            All Requests
          </Link>
          <Link href="/admin/requests?status=received" className="admin-quick-action">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            Evaluate Items
          </Link>
          <Link href="/admin/payments?status=pending" className="admin-quick-action">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Process Payments
          </Link>
        </div>

        {analytics ? (
          <>
            {/* Analytics Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
              <div className="admin-section" style={{ marginBottom: 0, padding: "16px", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Kits</p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#AD7B2A" }}>{analytics.summary.totalKits}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9CA3AF" }}>{analytics.summary.activeKits} active</p>
              </div>
              <div className="admin-section" style={{ marginBottom: 0, padding: "16px", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Revenue</p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#AD7B2A" }}>{formatCurrency(analytics.summary.totalRevenue)}</p>
              </div>
              <div className="admin-section" style={{ marginBottom: 0, padding: "16px", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Conversion</p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#AD7B2A" }}>{analytics.summary.conversionRate}%</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9CA3AF" }}>offers &rarr; paid</p>
              </div>
              <div className="admin-section" style={{ marginBottom: 0, padding: "16px", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Processing</p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#AD7B2A" }}>{analytics.summary.avgProcessingDays}d</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9CA3AF" }}>received &rarr; complete</p>
              </div>
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div className="admin-section" style={{ marginBottom: 0, padding: "16px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Kit Volume (6 mo)</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
                  {analytics.kitsByMonth.map((item, i) => {
                    const max = Math.max(...analytics.kitsByMonth.map(d => d.count), 1);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>{item.count}</span>
                        <div style={{ width: "100%", maxWidth: "40px", height: `${Math.max((item.count / max) * 80, 4)}px`, background: "#AD7B2A", borderRadius: "4px 4px 0 0" }} />
                        <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="admin-section" style={{ marginBottom: 0, padding: "16px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Revenue (6 mo)</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
                  {analytics.revenueByMonth.map((item, i) => {
                    const max = Math.max(...analytics.revenueByMonth.map(d => d.revenue), 1);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "10px", color: "#6B7280" }}>${Math.round(item.revenue)}</span>
                        <div style={{ width: "100%", maxWidth: "40px", height: `${Math.max((item.revenue / max) * 80, 4)}px`, background: "#10B981", borderRadius: "4px 4px 0 0" }} />
                        <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Kits by Status */}
            <div className="admin-section" style={{ padding: "16px", marginBottom: "24px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Kits by Status</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {analytics.kitsByStatus.map((item) => (
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
            <div className="admin-section" style={{ padding: "16px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Top Customers</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Kits</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topCustomers.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>{c.email}</div>
                        </td>
                        <td>{c.kitCount}</td>
                        <td style={{ color: "#AD7B2A", fontWeight: 500 }}>{formatCurrency(c.totalValue)}</td>
                      </tr>
                    ))}
                    {analytics.topCustomers.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", color: "#6B7280" }}>No data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p style={{ textAlign: "center", color: "#6B7280", padding: "40px" }}>Failed to load analytics data.</p>
        )}
      </main>

      <AdminBottomNav />
    </div>
  );
}
