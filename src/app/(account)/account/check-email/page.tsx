"use client";

import { Suspense, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPendingEmail, getPendingMagicLink } from "@/lib/account";

const subscribe = () => () => {};

function CheckEmailPageInner() {
  const searchParams = useSearchParams();
  const deliveryFailed = searchParams.get('delivery') === 'failed';
  const pendingEmail = useSyncExternalStore(subscribe, getPendingEmail, () => null);
  const email = searchParams.get("email") || pendingEmail;
  const magicLink = useSyncExternalStore(subscribe, getPendingMagicLink, () => null);

  return (
    <div className="account-login-container">
      <div className="account-login-card">
        <Link href="/">
          <Image
            src="/images/logos/GoldGeekLogo-horizontal.png"
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

        <h1 className="account-login-title">{deliveryFailed ? 'Request Received' : 'Check Your Email'}</h1>
        <p className="account-login-subtitle">
          {deliveryFailed ? 'Your kit request is saved, but we could not send a sign-in email to:' : 'We sent a magic link to:'}
        </p>
        {email && <p className="account-email-display">{email}</p>}
        <p className="account-login-subtitle">
          {deliveryFailed ? 'Request a new sign-in link below. You do not need to submit another kit request.' : 'Click the link in the email to access your dashboard.'}
        </p>

        <Link
          href={deliveryFailed && email ? `/account/login?email=${encodeURIComponent(email)}` : '/account/login'}
          className="account-btn account-btn-secondary account-btn-full"
          style={{ marginTop: 16 }}
        >
          {deliveryFailed ? 'Request a sign-in link' : 'Use a different email'}
        </Link>

        {magicLink && (
          <div className="account-demo-link">
            <div className="account-demo-link-label">Dev Only</div>
            <Link
              href={magicLink}
              className="account-btn account-btn-primary account-btn-full"
            >
              Click here to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailPageInner />
    </Suspense>
  );
}
