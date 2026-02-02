"use client";

import Link from "next/link";
import Image from "next/image";

interface AdminHeaderProps {
  title: string;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export default function AdminHeader({
  title,
  backHref,
  rightAction,
}: AdminHeaderProps) {
  return (
    <header className="admin-header">
      {backHref ? (
        <Link href={backHref} className="admin-back-btn">
          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
      ) : (
        <div style={{ width: "40px" }} />
      )}
      <span className="admin-header-title">
        {title === "Admin" && (
          <Image
            src="/images/favicon/cropped-GoldGeekFavicon-32x32.png"
            alt=""
            width={32}
            height={32}
            className="admin-header-logo"
          />
        )}
        {title}
      </span>
      {rightAction || <div style={{ width: "40px" }} />}
    </header>
  );
}
