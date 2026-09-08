import { historyQuery } from '@/lib/account/history';
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { ActivityService } from "@/lib/services/activity.service";
import { serializePrismaData } from "@/lib/db/utils";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const { page } = historyQuery(await searchParams);
  const result = await ActivityService.getCustomerEvents(session.id, 20, page);

  return <NotificationsClient events={serializePrismaData(result.events)} page={page} hasMore={result.hasMore} />;
}
