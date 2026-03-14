import { requireAdmin } from "@/lib/auth";
import { ActivityService } from "@/lib/services/activity.service";
import { serializePrismaData } from "@/lib/db/utils";
import ActivityClient from "./ActivityClient";

export default async function ActivityLogPage() {
  await requireAdmin();

  const result = await ActivityService.getAll(undefined, { page: 1, pageSize: 100 });

  return (
    <ActivityClient
      events={serializePrismaData(result.events) as any}
      total={result.total}
    />
  );
}
