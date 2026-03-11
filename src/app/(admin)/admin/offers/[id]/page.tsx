import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getOfferDetails } from "@/lib/actions/admin/offer.actions";
import OfferDetailClient from "./OfferDetailClient";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getOfferDetails(id);

  if (!result.success || !result.data) {
    redirect("/admin/offers");
  }

  return <OfferDetailClient offer={result.data} />;
}
