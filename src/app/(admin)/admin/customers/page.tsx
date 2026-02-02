import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllCustomers } from "@/lib/actions/admin/customer.actions";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/account/login");
  }

  const result = await getAllCustomers();
  const customers = result.data || [];

  return <CustomersClient customers={customers} />;
}
