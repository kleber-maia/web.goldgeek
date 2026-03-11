import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getAllKits } from "@/lib/actions/admin/kit.actions";
import RequestsClient from "./RequestsClient";

export default async function RequestsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getAllKits();
  const kits = result.data || [];

  return <RequestsClient kits={kits} />;
}
