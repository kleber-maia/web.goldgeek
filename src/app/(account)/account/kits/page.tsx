import { redirect } from "next/navigation";
import { AccountContainer, KitCard } from "@/components/account";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getMyKits } from "@/lib/actions/customer.actions";
import { normalizeKitType } from "@/lib/account";

type OfferLike = {
  status: string;
  totalValue: { toString(): string };
  createdAt: Date;
};

type KitLike = {
  id: string;
  kitNumber: string;
  type: string;
  status: string;
  createdAt: Date;
  items?: { id: string }[];
  offers?: OfferLike[];
};

export default async function ManageKitsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getMyKits();

  if (!result.success) {
    return (
      <AccountContainer
        headerProps={{
          title: "Manage My Kits",
          showBackButton: true,
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "red" }}>Error loading kits</p>
        </div>
      </AccountContainer>
    );
  }

  const allKits = (result.data || []) as KitLike[];

  // Split into active and completed
  const activeStatuses = ["PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED", "EVALUATING", "OFFER_SENT", "ACCEPTED", "DECLINED"];
  const completedStatuses = ["PAID", "RETURNED", "CANCELLED"];

  const activeKits = allKits.filter((kit) => activeStatuses.includes(kit.status));
  const completedKits = allKits.filter((kit) => completedStatuses.includes(kit.status));

  return (
    <AccountContainer
      headerProps={{
        title: "Manage My Kits",
        showBackButton: true,
      }}
    >
      {/* Active Kits Section */}
      <div className="account-section-divider">Active Kits</div>
      {activeKits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
          No active kits
        </p>
      ) : (
        activeKits.map((kit) => {
          const sortedOffers = [...(kit.offers || [])].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const activeOffer = sortedOffers.find((offer) => offer.status === "SENT");
          const offerForValue = activeOffer || sortedOffers[0];
          const hasOffer = kit.status === "OFFER_SENT" && Boolean(activeOffer);
          const needsShippingLabel =
            normalizeKitType(kit.type) === "digital" &&
            ["PENDING", "KIT_SENT"].includes(kit.status);

          return (
            <KitCard
              key={kit.id}
              kit={{
                id: kit.id,
                kitNumber: kit.kitNumber,
                type: kit.type,
                status: kit.status,
                createdAt: kit.createdAt?.toISOString?.() ?? kit.createdAt,
                itemCount: kit.items?.length ?? 0,
                offerValue: offerForValue
                  ? parseFloat(offerForValue.totalValue.toString())
                  : undefined,
                hasOffer,
                needsShippingLabel,
              }}
            />
          );
        })
      )}

      {/* Completed Kits Section */}
      <div className="account-section-divider">Completed</div>
      {completedKits.length === 0 ? (
        <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
          No completed kits yet
        </p>
      ) : (
        completedKits.map((kit) => {
          const sortedOffers = [...(kit.offers || [])].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const offerForValue = sortedOffers[0];
          return (
            <KitCard
              key={kit.id}
              kit={{
                id: kit.id,
                kitNumber: kit.kitNumber,
                type: kit.type,
                status: kit.status,
                createdAt: kit.createdAt?.toISOString?.() ?? kit.createdAt,
                itemCount: kit.items?.length ?? 0,
                offerValue: offerForValue
                  ? parseFloat(offerForValue.totalValue.toString())
                  : undefined,
                hasOffer: false,
                needsShippingLabel: false,
              }}
            />
          );
        })
      )}
    </AccountContainer>
  );
}
