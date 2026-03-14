import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getReturnById } from "@/lib/actions/admin/shipping.actions";
import ReturnDetailClient from "./ReturnDetailClient";

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const result = await getReturnById(id);
  if (!result.success || !result.data) {
    redirect("/admin/returns");
  }

  return <ReturnDetailClient returnData={result.data} />;
}
