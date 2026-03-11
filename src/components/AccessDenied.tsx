import Link from "next/link";

interface AccessDeniedProps {
  /** The type of user currently logged in */
  userType: "admin" | "customer";
}

export default function AccessDenied({ userType }: AccessDeniedProps) {
  const isAdmin = userType === "admin";

  const correctDashboard = isAdmin ? "/admin" : "/account";
  const correctLabel = isAdmin ? "Admin Dashboard" : "My Account";
  const areaName = isAdmin ? "customer" : "admin";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#F9FAFB",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          background: "#FFFFFF",
          borderRadius: 12,
          padding: "48px 32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#1F2937",
            margin: "0 0 8px",
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#6B7280",
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          You are logged in as {isAdmin ? "an admin" : "a customer"} and
          cannot access the {areaName} area.
        </p>

        <Link
          href={correctDashboard}
          style={{
            display: "inline-block",
            padding: "12px 32px",
            background: "#AD7B2A",
            color: "#FFFFFF",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Go to {correctLabel}
        </Link>
      </div>
    </div>
  );
}
