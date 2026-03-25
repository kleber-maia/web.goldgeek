import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getAllReturns } from "@/lib/actions/admin/shipping.actions";
import { getDeclinedOffersWithoutReturn } from "@/lib/actions/admin/offer.actions";
import ReturnsClient from "./ReturnsClient";

export default async function ReturnsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const [returnsResult, declinedResult] = await Promise.all([
    getAllReturns(),
    getDeclinedOffersWithoutReturn(),
  ]);

  const returns = returnsResult.data || [];
  const declinedOffers = declinedResult.data || [];

  return <ReturnsClient returns={returns} declinedOffers={declinedOffers} />;
}
