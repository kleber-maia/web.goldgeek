"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginPageInner />
    </Suspense>
  );
}

function AdminLoginPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devMagicLink, setDevMagicLink] = useState("");

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
        setSuccess(true);
        if (data.magicLinkUrl) {
          console.log("Admin Magic Link (dev only):", data.magicLinkUrl);
          setDevMagicLink(data.magicLinkUrl);
        }
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

        <h1 className="account-login-title">Administrator Login</h1>
        <p className="account-login-subtitle">
          Enter your admin email to access the dashboard
        </p>

        {/* Error from URL params */}
        {searchParams.get("error") && (
          <div className="account-alert account-alert-error" style={{ marginBottom: "20px" }}>
            {searchParams.get("error") === "missing_token" && "Invalid login link"}
            {searchParams.get("error") === "invalid_token" && "Login link expired or already used"}
            {searchParams.get("error") === "verification_failed" && "Login verification failed"}
            {searchParams.get("error") === "unauthorized" && "Unauthorized: Admin access required"}
          </div>
        )}

        {success ? (
          <div className="account-alert account-alert-success">
            <strong>Check your email!</strong>
            <p style={{ marginTop: "8px", marginBottom: 0 }}>
              We&apos;ve sent a magic link to <strong>{email}</strong>.
              Click the link in the email to access the admin dashboard.
            </p>
            {devMagicLink && (
              <div style={{ marginTop: "12px", padding: "10px", background: "rgba(0,0,0,0.05)", borderRadius: "6px", fontSize: "13px", wordBreak: "break-all" }}>
                <strong>Dev mode:</strong>{" "}
                <a href={devMagicLink} style={{ color: "#AD7B2A" }}>
                  Click here to login
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            {error && (
              <div className="account-alert account-alert-error" style={{ marginBottom: "15px" }}>
                {error}
              </div>
            )}

            <div className="account-form-group">
              <label className="account-form-label" htmlFor="email">
                Admin Email Address
              </label>
              <input
                type="email"
                id="email"
                className="account-form-input"
                placeholder="admin@goldgeek.com"
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
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
              {isSubmitting ? "Sending..." : "Send Admin Magic Link"}
            </button>
          </form>
        )}

        <p className="account-disclaimer">
          Secure admin authentication via magic link.
          <br />
          No password needed.
        </p>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link href="/account/login" style={{ color: "#AD7B2A", fontSize: "14px" }}>
            Customer Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
