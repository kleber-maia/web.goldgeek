import { redirect } from "next/navigation";
import { AccountContainer, KitCard } from "@/components/account";
import { getSession } from "@/lib/auth";
import { getMyKits } from "@/lib/actions/customer.actions";

export default async function ManageKitsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  const result = await getMyKits();

  if (!result.success) {
    return (
      <AccountContainer
        headerProps={{
          title: "Manage My Kits",
          showBack: true,
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "red" }}>Error loading kits</p>
        </div>
      </AccountContainer>
    );
  }

  const allKits = result.data || [];

  // Split into active and completed
  const activeStatuses = ["PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED", "EVALUATING", "OFFER_SENT", "ACCEPTED", "DECLINED"];
  const completedStatuses = ["PAID", "RETURNED", "CANCELLED"];

  const activeKits = allKits.filter((kit: any) => activeStatuses.includes(kit.status));
  const completedKits = allKits.filter((kit: any) => completedStatuses.includes(kit.status));

  return (
    <AccountContainer
      headerProps={{
        title: "Manage My Kits",
        showBack: true,
      }}
    >
      {/* Active Kits Section */}
      <div className="account-section-divider">Active Kits</div>
      {activeKits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
          No active kits
        </p>
      ) : (
        activeKits.map((kit) => <KitCard key={kit.id} kit={kit} />)
      )}

      {/* Completed Kits Section */}
      <div className="account-section-divider">Completed</div>
      {completedKits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
          No completed kits yet
        </p>
      ) : (
        completedKits.map((kit) => <KitCard key={kit.id} kit={kit} />)
      )}
    </AccountContainer>
  );
}
