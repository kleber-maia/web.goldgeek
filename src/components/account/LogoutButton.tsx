"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/account/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        display: "block",
        width: "100%",
        padding: "12px",
        background: "none",
        border: "none",
        color: "#2E1F0C",
        fontSize: "16px",
        fontWeight: 500,
        cursor: "pointer",
        marginBottom: "24px",
      }}
    >
      Logout
    </button>
  );
}
