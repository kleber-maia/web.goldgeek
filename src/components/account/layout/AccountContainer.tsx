"use client";

import { useEffect } from "react";
import StatusRefresh from "../StatusRefresh";
import AccountHeader from "./AccountHeader";
import AccountTopNav from "./AccountTopNav";
import BottomNav from "./BottomNav";

interface AccountContainerProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  customerInitial?: string;
  maxWidth?: number;
  headerProps?: {
    showBackButton?: boolean;
    backHref?: string;
    title?: string;
    rightAction?: React.ReactNode;
  };
}

export default function AccountContainer({
  children,
  showHeader = true,
  showNav = true,
  customerInitial,
  maxWidth = 960,
  headerProps = {},
}: AccountContainerProps) {
  useEffect(() => { document.title = `${headerProps.title || "Dashboard"} | Gold Geek`; }, [headerProps.title]);
  return (
    <div className="account-container">
      <a href="#account-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-white p-3 text-stone-900">Skip to content</a>
      {/* Desktop top nav - hidden on mobile via CSS */}
      <AccountTopNav customerInitial={customerInitial} />
      {/* Mobile header - hidden on desktop via CSS */}
      {showHeader && <AccountHeader {...headerProps} />}
      <main id="account-content" tabIndex={-1} className="account-main" style={{ maxWidth }}>
        {showHeader && headerProps.title && <h1 className="account-desktop-title hidden md:block text-2xl font-semibold mb-6">{headerProps.title}</h1>}
        <StatusRefresh />
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
