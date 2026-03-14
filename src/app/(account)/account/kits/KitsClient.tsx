"use client";

import { useState } from "react";
import { AccountContainer, KitCard } from "@/components/account";
import { normalizeKitType } from "@/lib/account";

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

type FilterTab = "all" | "active" | "completed";

export default function KitsClient({ kits }: { kits: KitData[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const activeStatuses = [
    "PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED",
    "EVALUATING", "OFFER_SENT", "ACCEPTED", "DECLINED",
  ];
  const completedStatuses = ["PAID", "RETURNED", "CANCELLED"];

  const filtered = kits.filter((kit) => {
    // Tab filter
    if (activeTab === "active" && !activeStatuses.includes(kit.status)) return false;
    if (activeTab === "completed" && !completedStatuses.includes(kit.status)) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return kit.kitNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = kits.filter((k) => activeStatuses.includes(k.status)).length;
  const completedCount = kits.filter((k) => completedStatuses.includes(k.status)).length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: kits.length },
    { key: "active", label: "Active", count: activeCount },
    { key: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <AccountContainer
      headerProps={{
        title: "Manage My Kits",
        showBackButton: true,
      }}
    >
      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search by kit number..."
          className="account-form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ fontSize: 14 }}
        />
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        marginBottom: 16,
        borderBottom: "1px solid var(--account-border)",
        paddingBottom: 0,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "#AD7B2A" : "#6B7280",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #AD7B2A" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Kit List */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
          {search ? "No kits match your search" : "No kits in this category"}
        </p>
      ) : (
        filtered.map((kit) => (
          <KitCard key={kit.id} kit={kit} />
        ))
      )}
    </AccountContainer>
  );
}
