import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/actions/admin/analytics.actions";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  await requireAdmin();

  const result = await getAnalytics();

  return <AnalyticsClient data={result.success ? result.data! : null} />;
}
