"use client";

import Link from "next/link";
import Image from "next/image";

interface AccountHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  rightAction?: React.ReactNode;
}

export default function AccountHeader({
  showBackButton = false,
  backHref = "/account",
  title,
  rightAction,
}: AccountHeaderProps) {
  return (
    <header className="account-header">
      {showBackButton ? (
        <Link href={backHref} aria-label="Back" className="account-back-btn">
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
      ) : (
        <Link href="/">
          <Image
            src="/images/logos/GoldGeekLogo-horizontal.png"
            alt="Gold Geek"
            width={120}
            height={32}
            className="account-header-logo"
          />
        </Link>
      )}

      {title && <h1 className="account-header-title m-0">{title}</h1>}

      {rightAction ? (
        rightAction
      ) : (
        <div style={{ width: 40 }} />
      )}
    </header>
  );
}
