"use client";

import Link from "next/link";
import { AccountContainer } from "@/components/account/layout";
import { LogoutButton } from "@/components/account/LogoutButton";
import { formatCurrency } from "@/lib/db/utils";

interface ActionItem {
  type: "offer" | "label";
  kitId: string;
  kitNumber: string;
  offerValue?: number;
  itemCount?: number;
}

interface KitSummary {
  id: string;
  kitNumber: string;
  status: string;
  type: string;
  createdAt: string;
  itemCount: number;
  offerValue?: number;
}

interface PaymentSummary {
  id: string;
  paymentNumber: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  kitNumber: string;
}

export interface DashboardData {
  firstName: string;
  customerInitial: string;
  stats: {
    totalKits: number;
    activeKits: number;
    offersReady: number;
    totalEarned: number;
  };
  actionRequired: ActionItem[];
  recentKits: KitSummary[];
  recentPayments: PaymentSummary[];
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function statusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "SHIPPED":
    case "EVALUATING":
      return "bg-blue-50 text-blue-700";
    case "OFFER_SENT":
      return "bg-purple-50 text-purple-700";
    case "ACCEPTED":
    case "PAID":
    case "COMPLETED":
    case "SENT":
      return "bg-emerald-50 text-emerald-700";
    case "DECLINED":
    case "CANCELLED":
    case "FAILED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { firstName, customerInitial, stats, actionRequired, recentKits, recentPayments } = data;

  return (
    <AccountContainer
      customerInitial={customerInitial}
      maxWidth={1200}
      headerProps={{
        rightAction: (
          <Link href="/account/settings" className="account-header-action">
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        ),
      }}
    >
      {/* Welcome Hero */}
      <section className="account-welcome-gradient rounded-2xl p-5 md:p-8 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-[#2E1F0C] m-0">
          Welcome back, <span className="text-[#AD7B2A]">{firstName}</span>
        </h1>
        <p className="text-sm md:text-base text-[#6B7280] mt-1 mb-0">
          {stats.activeKits > 0 || stats.offersReady > 0
            ? `You have ${stats.activeKits} active kit${stats.activeKits !== 1 ? "s" : ""}${stats.offersReady > 0 ? ` and ${stats.offersReady} new offer${stats.offersReady !== 1 ? "s" : ""}` : ""}`
            : "Your dashboard overview"}
        </p>
      </section>

      {/* Stat Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="account-stat-card bg-white rounded-xl border border-[#E5E5E5] p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AD7B2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <span className="text-xs text-[#6B7280] font-medium">Total Kits</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#2E1F0C]">{stats.totalKits}</div>
        </div>

        <div className="account-stat-card bg-white rounded-xl border border-[#E5E5E5] p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AD7B2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs text-[#6B7280] font-medium">Active Kits</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#2E1F0C]">{stats.activeKits}</div>
        </div>

        <div className="account-stat-card bg-white rounded-xl border border-[#E5E5E5] p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AD7B2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            <span className="text-xs text-[#6B7280] font-medium">Offers Ready</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#2E1F0C]">{stats.offersReady}</div>
        </div>

        <div className="account-stat-card bg-white rounded-xl border border-[#E5E5E5] p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AD7B2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-xs text-[#6B7280] font-medium">Total Earned</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#2E1F0C]">
            {stats.totalEarned > 0 ? formatCurrency(stats.totalEarned) : "$0"}
          </div>
        </div>
      </section>

      {/* Action Required */}
      {actionRequired.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3 flex items-center gap-2">
            Action Required
            <span className="bg-[#EF4444] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {actionRequired.length}
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            {actionRequired.map((item) =>
              item.type === "offer" ? (
                <Link
                  key={item.kitId}
                  href={`/account/kit/${item.kitId}`}
                  className="block bg-emerald-50 border border-emerald-200 rounded-xl p-4 md:p-5 no-underline hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-emerald-900 m-0">
                          Offer Ready — Kit #{item.kitNumber}
                        </h3>
                        {item.offerValue != null && (
                          <span className="text-lg font-bold text-emerald-700">
                            {formatCurrency(item.offerValue)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-emerald-700 mt-1 mb-0">
                        {item.itemCount ? `${item.itemCount} item${item.itemCount !== 1 ? "s" : ""} evaluated — ` : ""}Review and respond to your offer
                      </p>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              ) : (
                <Link
                  key={item.kitId}
                  href={`/account/kit/${item.kitId}`}
                  className="block bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5 no-underline hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-amber-900 m-0">
                        Kit #{item.kitNumber} needs a Digital Kit
                      </h3>
                      <p className="text-sm text-amber-700 mt-1 mb-0">
                        Print your Digital Kit to ship your items to us
                      </p>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              )
            )}
          </div>
        </section>
      )}

      {/* Two-Column: Kits + Payments */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Recent Kits */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#E5E5E5]">
            <h2 className="text-base font-semibold text-[#2E1F0C] m-0">Your Kits</h2>
            <Link href="/account/kits" className="text-sm font-medium text-[#AD7B2A] no-underline hover:underline">
              View All
            </Link>
          </div>
          {recentKits.length > 0 ? (
            <div className="divide-y divide-[#F3F4F6]">
              {recentKits.map((kit) => (
                <Link
                  key={kit.id}
                  href={`/account/kit/${kit.id}`}
                  className="flex items-center justify-between p-4 no-underline hover:bg-[#FAFAF8] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#2E1F0C]">#{kit.kitNumber}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(kit.status)}`}>
                        {formatStatus(kit.status)}
                      </span>
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-1">
                      {kit.itemCount} item{kit.itemCount !== 1 ? "s" : ""} &middot; {formatDate(kit.createdAt)}
                      {kit.offerValue != null && (
                        <span className="text-[#AD7B2A] font-medium"> &middot; {formatCurrency(kit.offerValue)}</span>
                      )}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-[#9CA3AF]">
              No kits yet. Request your first kit to get started!
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#E5E5E5]">
            <h2 className="text-base font-semibold text-[#2E1F0C] m-0">Recent Payments</h2>
            <Link href="/account/payments" className="text-sm font-medium text-[#AD7B2A] no-underline hover:underline">
              View All
            </Link>
          </div>
          {recentPayments.length > 0 ? (
            <div className="divide-y divide-[#F3F4F6]">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#2E1F0C]">
                        {formatCurrency(payment.amount)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(payment.status)}`}>
                        {formatStatus(payment.status)}
                      </span>
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-1">
                      Kit #{payment.kitNumber} &middot; {formatDate(payment.createdAt)}
                    </div>
                  </div>
                  <span className="text-xs text-[#9CA3AF] capitalize">{payment.method.toLowerCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-[#9CA3AF]">
              No payments yet. Complete your first kit to get paid!
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-col sm:flex-row gap-3 mb-6">
        <Link
          href="/account/request-kit"
          className="flex-1 flex items-center justify-center gap-2 bg-[#AD7B2A] text-white font-semibold text-sm py-3.5 px-6 rounded-xl no-underline hover:bg-[#96691F] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Request New Kit
        </Link>
        <Link
          href="#refer"
          className="flex-1 flex items-center justify-center gap-2 bg-white text-[#AD7B2A] font-semibold text-sm py-3.5 px-6 rounded-xl border-2 border-[#AD7B2A] no-underline hover:bg-[#FBF7EF] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
            <path d="M6 10V7H4v3H1v2h3v3h2v-3h3v-2H6z" />
            <path d="M15 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Refer a Friend — $25
        </Link>
      </section>

      {/* Logout */}
      <LogoutButton />
    </AccountContainer>
  );
}
