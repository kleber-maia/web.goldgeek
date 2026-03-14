import { requireAdmin } from "@/lib/auth";
import { getAllCustomers } from "@/lib/actions/admin/customer.actions";
import NewRequestClient from "./NewRequestClient";

export default async function NewRequestPage() {
  await requireAdmin();

  const result = await getAllCustomers();
  const customers = result.success ? (result.data as any[]) : [];

  return <NewRequestClient customers={customers} />;
}
