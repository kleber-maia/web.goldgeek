"use client";

import Link from "next/link";
import HistoryPagination from "@/components/account/HistoryPagination";
import { AccountContainer, KitCard } from "@/components/account";

interface KitData {
  id: string;
  kitNumber: string;
  type: string;
  status: string;
  createdAt: string;
  itemCount: number;
  offerValue?: number;
  hasOffer: boolean;
  needsShippingLabel: boolean;
}


export default function KitsClient({ kits, page, hasMore, query }: { kits: KitData[]; page: number; hasMore: boolean; query: { q: string; status: string } }) {
  const activeTab = query.status;
  const search = query.q;
  const tabs = [{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }];
  const filterHref = (status: string) => `/account/kits?${new URLSearchParams({ status, q: search })}`;
  return (
    <AccountContainer
      headerProps={{
        title: "Manage My Kits",
        showBackButton: true,
      }}
    >
      {/* Search */}
      <form action="/account/kits" style={{ marginBottom: 12 }} className="flex gap-2">
        <input type="hidden" name="status" value={activeTab} />
        <input
          type="text"
          placeholder="Search by kit number..."
          aria-label="Search by kit number"
          className="account-form-input"
          name="q"
          defaultValue={search}
          key={search}
          style={{ fontSize: 14 }}
        />
        <button type="submit" className="account-btn account-btn-primary">Search</button>
      </form>

      {/* Filter Tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        marginBottom: 16,
        borderBottom: "1px solid var(--account-border)",
        paddingBottom: 0,
      }}>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={filterHref(tab.key)}
            aria-current={activeTab === tab.key ? "page" : undefined}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "var(--brand-primary)" : "var(--status-gray)",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid var(--brand-primary)" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Kit List */}
      {kits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
          {search ? "No kits match your search" : "No kits in this category"}
        </p>
      ) : (
        kits.map((kit) => (
          <KitCard key={kit.id} kit={kit} returnTo={`/account/kits?${new URLSearchParams({ status: activeTab, q: search, page: String(page) })}`} />
        ))
      )}
      <HistoryPagination page={page} hasMore={hasMore} />
    </AccountContainer>
  );
}
