import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountContainer } from "@/components/account";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { CustomerService } from "@/lib/services/customer.service";
import { LogoutButton } from "@/components/account/LogoutButton";
import { SettingsService } from "@/lib/services/settings.service";

const ACTIVE_KIT_STATUSES = ["PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED", "EVALUATING"] as const;

interface Shortcut {
  href: string;
  title: string;
  description: string;
  highlight?: boolean;
}

function buildShortcuts(supportEmail: string, phone: string): Shortcut[] {
  const contactParts: string[] = [];
  if (supportEmail) contactParts.push(`email ${supportEmail}`);
  if (phone) contactParts.push(`call ${phone}`);
  const contactDesc = contactParts.length
    ? `Contact support: ${contactParts.join(" or ")}.`
    : "Contact support for help.";

  return [
    {
      href: "/account/settings",
      title: "Edit My Account",
      description: "Update your personal information and payment preferences.",
    },
    {
      href: "/account/kits",
      title: "Manage My Kits",
      description: "View order history and track kits in transit.",
    },
    {
      href: "/account/payments",
      title: "My Payments",
      description: "Track payment status and history.",
    },
    {
      href: "#refer",
      title: "Refer Friends",
      description: "Get $25 when friends sell to us.",
    },
    {
      href: supportEmail ? `mailto:${supportEmail}` : "#",
      title: "Get Help",
      description: contactDesc,
    },
    {
      href: "/account/request-kit",
      title: "Request Another Kit",
      description: "Have more items? Get another kit!",
    },
  ];
}

// Icons as simple components
const icons = [
  // Edit Account - person icon
  <svg key="edit" width="32" height="32" viewBox="0 0 24 24" fill="#2E1F0C"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  // Manage Kits - envelope
  <svg key="kits" width="32" height="32" viewBox="0 0 24 24" fill="#2E1F0C"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>,
  // View Offers - dollar
  <svg key="offers" width="32" height="32" viewBox="0 0 24 24" fill="#2E1F0C"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
  // Refer Friends - people
  <svg key="refer" width="32" height="32" viewBox="0 0 24 24" fill="#2E1F0C"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  // Get Help - question
  <svg key="help" width="32" height="32" viewBox="0 0 24 24" fill="#2E1F0C"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>,
  // Request Kit - plus
  <svg key="request" width="32" height="32" viewBox="0 0 24 24" fill="#2E1F0C"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
];

export default async function AccountDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  // Single DB call: get customer + kits together
  const customer = await CustomerService.getById(session.id);

  if (!customer) {
    redirect("/account/login");
  }

  const firstName = customer.firstName || customer.email.split("@")[0];
  const company = await SettingsService.getCompanyInfo();

  const kits = await CustomerService.getKits(session.id);
  const activeKitCount = kits.filter((k) =>
    (ACTIVE_KIT_STATUSES as readonly string[]).includes(k.status)
  ).length;
  const kitsWithOffer = kits.filter((k) => k.status === "OFFER_SENT");
  const offerCount = kitsWithOffer.length;
  const kitsNeedingLabel = kits.filter(
    (k) =>
      k.type === "DIGITAL" &&
      ["PENDING", "KIT_SENT"].includes(k.status) &&
      (k.shippingLabels?.length ?? 0) === 0
  );

  const defaultShortcuts = buildShortcuts(company.supportEmail, company.phone);
  const shortcuts = defaultShortcuts.map((s, i) => {
    if (i === 1 && activeKitCount > 0) {
      return {
        ...s,
        description: `${activeKitCount} kit${activeKitCount === 1 ? "" : "s"} in progress`,
        highlight: true,
      };
    }
    if (i === 2) {
      // "My Payments" tile — no dynamic count needed
      return s;
    }
    return s;
  });

  const styles = {
    banner: {
      background: "#3D3D3D",
      color: "#FFFFFF",
      padding: "20px 24px",
      borderRadius: "8px",
      marginBottom: "20px",
      textAlign: "center" as const,
    },
    bannerTitle: {
      fontSize: "20px",
      fontWeight: 400,
      margin: 0,
      fontStyle: "italic" as const,
      lineHeight: 1.4,
    },
    bannerName: {
      color: "#AD7B2A",
      fontWeight: 600,
    },
    description: {
      fontSize: "15px",
      color: "#6B7280",
      textAlign: "center" as const,
      lineHeight: 1.6,
      margin: "0 0 24px 0",
    },
    subtitle: {
      fontSize: "20px",
      fontWeight: 400,
      fontStyle: "italic" as const,
      color: "#2E1F0C",
      textAlign: "center" as const,
      margin: "0 0 16px 0",
    },
    grid: {} as React.CSSProperties,
    card: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      padding: "20px 16px",
      background: "#FFFFFF",
      border: "1px solid #E5E5E5",
      borderRadius: "8px",
      textDecoration: "none",
      color: "inherit",
    },
    cardIcon: {
      marginBottom: "12px",
    },
    cardTitle: {
      fontSize: "15px",
      fontWeight: 600,
      color: "#2E1F0C",
      textAlign: "center" as const,
      margin: "0 0 8px 0",
    },
    cardDesc: {
      fontSize: "13px",
      color: "#6B7280",
      textAlign: "center" as const,
      lineHeight: 1.4,
      margin: 0,
      paddingTop: "10px",
      borderTop: "1px solid #E5E5E5",
      width: "100%",
    },
  };

  return (
    <AccountContainer
      headerProps={{
        rightAction: (
          <Link href="/account/settings" className="account-header-action">
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
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        ),
      }}
    >
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <h1 style={styles.bannerTitle}>
          <span style={styles.bannerName}>Hi, {firstName}.</span>{" "}
          Welcome to your {company.name} Dashboard
        </h1>
      </div>

      <p style={styles.description}>
        This Dashboard gives you easy access to all the tools you need to safely
        and securely sell your gold—and to get the fastest turnaround and the
        highest payouts.
      </p>

      {/* Label Alert */}
      {kitsNeedingLabel.map((kit) => (
        <Link
          key={kit.id}
          href={`/account/kit/${kit.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "#FEF3C7",
            border: "1px solid #F59E0B",
            borderRadius: 8,
            marginBottom: 12,
            textDecoration: "none",
            color: "#92400E",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Kit #{kit.kitNumber} needs a Digital Kit
            </div>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              Print your Digital Kit to ship your items to us
            </div>
          </div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#92400E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ))}

      {/* Offer Alert */}
      {kitsWithOffer.map((kit) => (
        <Link
          key={kit.id}
          href={`/account/kit/${kit.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "#ECFDF5",
            border: "1px solid #10B981",
            borderRadius: 8,
            marginBottom: 12,
            textDecoration: "none",
            color: "#065F46",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Kit #{kit.kitNumber} has an offer ready
            </div>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              Review and respond to your offer
            </div>
          </div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#065F46"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ))}

      {/* Quick Shortcuts */}
      <h2 style={styles.subtitle}>What would you like to do?</h2>
      <div className="account-dashboard-grid">
        {shortcuts.map((shortcut, index) => (
          <Link key={shortcut.title} href={shortcut.href} style={styles.card}>
            <div style={styles.cardIcon}>{icons[index]}</div>
            <h3 style={styles.cardTitle}>{shortcut.title}</h3>
            <p style={{
              ...styles.cardDesc,
              ...(shortcut.highlight && { color: "#AD7B2A", fontWeight: 600 }),
            }}>
              {shortcut.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <LogoutButton />
    </AccountContainer>
  );
}
