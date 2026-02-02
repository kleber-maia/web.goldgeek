import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllKits } from "@/lib/actions/admin/kit.actions";
import RequestsClient from "./RequestsClient";

export default async function RequestsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    redirect("/admin/login?error=unauthorized");
  }

  const result = await getAllKits();
  const kits = result.data || [];

  return <RequestsClient kits={kits} />;
}
