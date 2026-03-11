import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getKitDetails } from "@/lib/actions/admin/kit.actions";
import RequestDetailClient from "./RequestDetailClient";

export default async function RequestDetailPage({
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

  const result = await getKitDetails(id);

  if (!result.success || !result.data) {
    redirect("/admin/requests");
  }

  return <RequestDetailClient kit={result.data} />;
}
