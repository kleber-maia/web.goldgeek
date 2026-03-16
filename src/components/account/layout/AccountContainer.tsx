"use client";

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
  return (
    <div className="account-container">
      {/* Desktop top nav - hidden on mobile via CSS */}
      <AccountTopNav customerInitial={customerInitial} />
      {/* Mobile header - hidden on desktop via CSS */}
      {showHeader && <AccountHeader {...headerProps} />}
      <main className="account-main" style={{ maxWidth }}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
