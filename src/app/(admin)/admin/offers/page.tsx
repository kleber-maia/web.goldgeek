import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getAllOffers } from "@/lib/actions/admin/offer.actions";
import { getKitsForEvaluation } from "@/lib/actions/admin/kit.actions";
import OffersClient from "./OffersClient";

export default async function OffersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const [offersResult, evalKitsResult] = await Promise.all([
    getAllOffers(),
    getKitsForEvaluation(),
  ]);

  const offers = offersResult.data || [];
  const evaluationKits = evalKitsResult.data || [];

  return <OffersClient offers={offers} evaluationKits={evaluationKits} />;
}
