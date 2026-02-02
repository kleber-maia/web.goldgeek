import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/actions/admin/customer.actions";
import CustomerDetailClient from "./CustomerDetailClient";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/account/login");
  }

  const result = await getCustomerById(params.id);

  if (!result.success || !result.data) {
    redirect("/admin/customers");
  }

  return <CustomerDetailClient customer={result.data} />;
}
