import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getMyKits } from "@/lib/actions/customer.actions";
import { normalizeKitType } from "@/lib/account";
import KitsClient from "./KitsClient";

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
    redirect("/account");
  }

  const allKits = (result.data || []) as KitLike[];

  const kitsForClient = allKits.map((kit) => {
    const sortedOffers = [...(kit.offers || [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const activeOffer = sortedOffers.find((offer) => offer.status === "SENT");
    const offerForValue = activeOffer || sortedOffers[0];
    const hasOffer = kit.status === "OFFER_SENT" && Boolean(activeOffer);
    const needsShippingLabel =
      normalizeKitType(kit.type) === "digital" &&
      ["PENDING", "SHIPPED"].includes(kit.status);

    return {
      id: kit.id,
      kitNumber: kit.kitNumber,
      type: kit.type,
      status: kit.status,
      createdAt: kit.createdAt?.toISOString?.() ?? String(kit.createdAt),
      itemCount: kit.items?.length ?? 0,
      offerValue: offerForValue
        ? parseFloat(offerForValue.totalValue.toString())
        : undefined,
      hasOffer,
      needsShippingLabel,
    };
  });

  return <KitsClient kits={kitsForClient} />;
}
