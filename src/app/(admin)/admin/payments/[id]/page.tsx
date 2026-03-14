import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPaymentDetails } from "@/lib/actions/admin/payment.actions";
import PaymentDetailClient from "./PaymentDetailClient";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const result = await getPaymentDetails(id);
  if (!result.success || !result.data) {
    redirect("/admin/payments");
  }

  return <PaymentDetailClient payment={result.data} />;
}
