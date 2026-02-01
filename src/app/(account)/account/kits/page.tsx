"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountContainer, KitCard } from "@/components/account";
import {
  getSession,
  getActiveKits,
  getCompletedKits,
  Kit,
  TimelineEvent,
} from "@/lib/account";

type KitWithTimeline = Kit & { timeline: TimelineEvent[] };

export default function ManageKitsPage() {
  const router = useRouter();
  const [activeKits, setActiveKits] = useState<KitWithTimeline[]>([]);
  const [completedKits, setCompletedKits] = useState<KitWithTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/account/login");
      return;
    }

    setActiveKits(getActiveKits(session.userId));
    setCompletedKits(getCompletedKits(session.userId));
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <AccountContainer
        headerProps={{
          title: "Manage My Kits",
          showBack: true,
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--status-gray)" }}>Loading...</p>
        </div>
      </AccountContainer>
    );
  }

  return (
    <AccountContainer
      headerProps={{
        title: "Manage My Kits",
        showBack: true,
      }}
    >
      {/* Active Kits Section */}
      <div className="account-section-divider">Active Kits</div>
      {activeKits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
          No active kits
        </p>
      ) : (
        activeKits.map((kit) => <KitCard key={kit.id} kit={kit} />)
      )}

      {/* Completed Kits Section */}
      <div className="account-section-divider">Completed</div>
      {completedKits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
          No completed kits yet
        </p>
      ) : (
        completedKits.map((kit) => <KitCard key={kit.id} kit={kit} />)
      )}
    </AccountContainer>
  );
}
