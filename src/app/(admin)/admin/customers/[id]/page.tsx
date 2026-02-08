import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/actions/admin/customer.actions";
import CustomerDetailClient from "./CustomerDetailClient";

export default async function CustomerDetailPage({
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
    redirect("/admin/login?error=unauthorized");
  }

  const result = await getCustomerById(id);

  if (!result.success || !result.data) {
    redirect("/admin/customers");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <CustomerDetailClient customer={result.data as any} />;
}
