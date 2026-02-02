import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getKitDetails } from "@/lib/actions/admin/kit.actions";
import RequestDetailClient from "./RequestDetailClient";

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/account/login");
  }

  const result = await getKitDetails(params.id);

  if (!result.success || !result.data) {
    redirect("/admin/requests");
  }

  return <RequestDetailClient kit={result.data} />;
}
