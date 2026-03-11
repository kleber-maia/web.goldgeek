import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getAllOffers } from "@/lib/actions/admin/offer.actions";
import OffersClient from "./OffersClient";

export default async function OffersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getAllOffers();
  const offers = result.data || [];

  return <OffersClient offers={offers} />;
}
