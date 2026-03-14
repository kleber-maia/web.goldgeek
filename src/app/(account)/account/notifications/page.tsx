import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { ActivityService } from "@/lib/services/activity.service";
import { serializePrismaData } from "@/lib/db/utils";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const events = await ActivityService.getCustomerEvents(session.id, 50);

  return <NotificationsClient events={serializePrismaData(events) as any} />;
}
