import { historyQuery } from '@/lib/account/history';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getMyPayments } from "@/lib/actions/customer.actions";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const { page } = historyQuery(await searchParams);
  const result = await getMyPayments(page);

  if (!result.success) throw new Error("Unable to load history. Please try again.");

  const payments = result.data || [];

  return <PaymentsClient page={page} hasMore={result.hasMore ?? false} payments={payments} />;
}
