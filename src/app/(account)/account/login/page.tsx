"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { setPendingEmail, setPendingMagicLink } from "@/lib/account";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setPendingEmail(email);
        if (data.magicLinkUrl) {
          setPendingMagicLink(data.magicLinkUrl);
        }
        router.push("/account/check-email");
        return;
      } else {
        setError(data.error || "Failed to send magic link");
      }
    } catch (err) {
      console.error("Error sending magic link:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <h1 className="account-login-title">Check Your Appraisal</h1>
        <p className="account-login-subtitle">
          Enter your email to access your dashboard
        </p>

        {/* Error from URL params */}
        {searchParams.get("error") && (
          <div className="account-alert account-alert-error" style={{ marginBottom: "20px" }}>
            {searchParams.get("error") === "missing_token" && "Invalid login link"}
            {searchParams.get("error") === "invalid_token" && "Login link expired or already used"}
            {searchParams.get("error") === "verification_failed" && "Login verification failed"}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          {error && (
            <div className="account-alert account-alert-error" style={{ marginBottom: "15px" }}>
              {error}
            </div>
          )}

          <div className="account-form-group">
            <label className="account-form-label" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="account-form-input"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="account-btn account-btn-primary account-btn-full"
            disabled={isSubmitting}
          >
            <svg
              width="18"
              height="18"
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
            {isSubmitting ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        <p className="account-disclaimer">
          We&apos;ll send you a secure link to access your dashboard.
          <br />
          No password needed.
        </p>
      </div>
    </div>
  );
}
