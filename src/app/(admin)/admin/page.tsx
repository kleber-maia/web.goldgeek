import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/db/utils";
import { ActivityService } from "@/lib/services/activity.service";

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "Yesterday";
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    redirect("/admin/login?error=unauthorized");
  }

  // Get stats
  const [newRequests, inTransit, pendingOffers, thisMonthPayments] = await Promise.all([
    prisma.kit.count({ where: { status: { in: ["PENDING", "KIT_SENT"] } } }),
    prisma.kit.count({ where: { status: "IN_TRANSIT" } }),
    prisma.offer.count({ where: { status: "SENT" } }),
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const monthlyRevenue = thisMonthPayments._sum.amount || 0;

  // Get recent activity
  const recentEvents = await ActivityService.getRecentEvents(6);

  const stats = {
    newRequests,
    inTransit,
    pendingOffers,
    monthlyRevenue: formatCurrency(parseFloat(monthlyRevenue.toString())),
  };

  const recentActivity = recentEvents.map((event) => ({
    id: event.id,
    content: event.description || event.title,
    time: getTimeAgo(event.createdAt),
  }));

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="Admin" />

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-label">New Requests</div>
            <div className="admin-stat-value">{stats.newRequests}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">In Transit</div>
            <div className="admin-stat-value">{stats.inTransit}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Pending Offers</div>
            <div className="admin-stat-value">{stats.pendingOffers}</div>
          </div>
          <div className="admin-stat-card primary">
            <div className="admin-stat-label">This Month</div>
            <div className="admin-stat-value">{stats.monthlyRevenue}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-quick-actions">
          <Link href="/admin/requests" className="admin-quick-action">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Request
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

        {/* Recent Activity */}
        <div className="admin-section-header">
          <h2 className="admin-section-title">Recent Activity</h2>
        </div>

        <div className="admin-activity-list">
          {recentActivity.length === 0 ? (
            <div className="admin-activity-card">
              <div className="admin-activity-content">No recent activity</div>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="admin-activity-card">
                <div className="admin-activity-content">{activity.content}</div>
                <div className="admin-activity-time">{activity.time}</div>
              </div>
            ))
          )}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
