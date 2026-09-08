import { historyQuery } from '@/lib/account/history';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getMyReturns } from "@/lib/actions/customer.actions";
import ReturnsClient from "./ReturnsClient";

export default async function CustomerReturnsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const { page } = historyQuery(await searchParams);
  const result = await getMyReturns(page);

  if (!result.success) throw new Error("Unable to load history. Please try again.");

  return <ReturnsClient page={page} hasMore={result.hasMore ?? false} returns={result.data || []} />;
}
