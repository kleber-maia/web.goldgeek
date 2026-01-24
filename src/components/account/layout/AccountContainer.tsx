"use client";

import AccountHeader from "./AccountHeader";
import BottomNav from "./BottomNav";

interface AccountContainerProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
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
  headerProps = {},
}: AccountContainerProps) {
  return (
    <div className="account-container">
      {showHeader && <AccountHeader {...headerProps} />}
      <main className="account-main">{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
