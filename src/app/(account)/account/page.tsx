"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountContainer, KitCard } from "@/components/account";
import {
  getSession,
  getActiveKits,
  getCompletedKits,
  Kit,
  TimelineEvent,
  UserSession,
} from "@/lib/account";

type KitWithTimeline = Kit & { timeline: TimelineEvent[] };

export default function AccountDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeKits, setActiveKits] = useState<KitWithTimeline[]>([]);
  const [completedKits, setCompletedKits] = useState<KitWithTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/account/login");
      return;
    }

    setUser(session);
    setActiveKits(getActiveKits(session.userId));
    setCompletedKits(getCompletedKits(session.userId));
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <AccountContainer>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--status-gray)" }}>Loading...</p>
        </div>
      </AccountContainer>
    );
  }

  const firstName = user?.name.split(" ")[0] || "there";

  return (
    <AccountContainer
      headerProps={{
        rightAction: (
          <Link href="/account/settings" className="account-header-action">
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        ),
      }}
    >
      <div className="account-welcome">
        <h1 className="account-welcome-title">Welcome, {firstName}!</h1>
      </div>

      <div className="account-section-divider">Active Kits</div>
      {activeKits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
          No active kits
        </p>
      ) : (
        activeKits.map((kit) => <KitCard key={kit.id} kit={kit} />)
      )}

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
