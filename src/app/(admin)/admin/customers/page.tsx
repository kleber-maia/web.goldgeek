import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllCustomers } from "@/lib/actions/admin/customer.actions";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    redirect("/admin/login?error=unauthorized");
  }

  const result = await getAllCustomers();
  const customers = (result.data || []) as Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    createdAt: Date;
    addresses: unknown[];
    kits: unknown[];
    payments: Array<{ amount?: { toString(): string } }>;
  }>;

  return <CustomersClient customers={customers} />;
}
