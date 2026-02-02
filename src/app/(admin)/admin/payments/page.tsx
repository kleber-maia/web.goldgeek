import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllPayments } from "@/lib/actions/admin/payment.actions";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/account/login");
  }

  const result = await getAllPayments();
  const payments = result.data || [];

  return <PaymentsClient payments={payments} />;
}
