import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getAllPayments } from "@/lib/actions/admin/payment.actions";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getAllPayments();
  const payments = result.data || [];

  return <PaymentsClient payments={payments} />;
}
