"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAdminBadgeCounts, type BadgeCounts } from "@/lib/actions/admin/badge.actions";

const BadgeContext = createContext<BadgeCounts | null>(null);

export function useAdminBadges() {
  return useContext(BadgeContext);
}

export default function AdminBadgeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<BadgeCounts | null>(null);

  useEffect(() => {
    const fetchBadges = () => getAdminBadgeCounts().then(setBadges).catch(() => {});
    fetchBadges();
    const interval = setInterval(fetchBadges, 30_000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <BadgeContext.Provider value={badges}>
      {children}
    </BadgeContext.Provider>
  );
}
