"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPendingEmail, generateMockMagicLink } from "@/lib/account";

export default function CheckEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [demoLink, setDemoLink] = useState<string>("");

  useEffect(() => {
    const pendingEmail = getPendingEmail();
    setEmail(pendingEmail);
    if (pendingEmail) {
      setDemoLink(generateMockMagicLink(pendingEmail));
    }
  }, []);

  return (
    <div className="account-login-container">
      <div className="account-login-card">
        <Link href="/">
          <Image
            src="/images/GoldGeekLogo-horizontal.png"
            alt="Gold Geek"
            width={180}
            height={48}
            className="account-login-logo"
          />
        </Link>

        <svg
          className="account-check-email-icon"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>

        <h1 className="account-login-title">Check Your Email</h1>
        <p className="account-login-subtitle">
          We sent a magic link to:
        </p>
        {email && <p className="account-email-display">{email}</p>}
        <p className="account-login-subtitle">
          Click the link in the email to access your dashboard.
        </p>

        <Link
          href="/account/login"
          className="account-btn account-btn-secondary account-btn-full"
          style={{ marginTop: 16 }}
        >
          Use a different email
        </Link>

        {/* Demo link for testing */}
        <div className="account-demo-link">
          <div className="account-demo-link-label">Demo Only</div>
          <Link
            href={demoLink}
            className="account-btn account-btn-primary account-btn-full"
          >
            Click here to simulate magic link
          </Link>
        </div>
      </div>
    </div>
  );
}
