import { historyQuery } from '@/lib/account/history';
import { isActionableOffer, canPrepareDigitalKit } from '@/lib/account/kit-policy';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getMyKits } from "@/lib/actions/customer.actions";
import KitsClient from "./KitsClient";

type OfferLike = {
  status: string;
  totalValue: { toString(): string };
  createdAt: string;
  expiresAt?: string | Date;
};

type KitLike = {
  id: string;
  kitNumber: string;
  type: string;
  status: string;
  createdAt: string;
  items?: { id: string; quantity: number }[];
  offers?: OfferLike[];
  shippingLabels?: {type: string; status: string}[];
};

export default async function ManageKitsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const query = historyQuery(await searchParams);
  const result = await getMyKits(query);

  if (!result.success) {
    throw new Error("Unable to load your kits. Please try again.");
  }

  const allKits = (result.data || []) as KitLike[];

  const kitsForClient = allKits.map((kit) => {
    const sortedOffers = [...(kit.offers || [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const activeOffer = sortedOffers.find(offer => isActionableOffer(offer));
    const offerForValue = activeOffer || sortedOffers[0];
    const hasOffer = kit.status === "OFFER_SENT" && Boolean(activeOffer);
    const needsShippingLabel =
      canPrepareDigitalKit(kit);

    return {
      id: kit.id,
      kitNumber: kit.kitNumber,
      type: kit.type,
      status: kit.status,
      createdAt: String(kit.createdAt),
      itemCount: kit.items?.reduce((total, item) => total + (item.quantity || 1), 0) ?? 0,
      offerValue: offerForValue
        ? parseFloat(offerForValue.totalValue.toString())
        : undefined,
      hasOffer,
      needsShippingLabel,
    };
  });

  return <KitsClient kits={kitsForClient} page={query.page} hasMore={result.hasMore ?? false} query={query} />;
}
