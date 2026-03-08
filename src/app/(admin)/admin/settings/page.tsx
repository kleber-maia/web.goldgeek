import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompanySettings } from "@/lib/actions/admin/settings.actions";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    redirect("/admin/login?error=unauthorized");
  }

  const result = await getCompanySettings();
  const settings = result.data ?? null;

  return <SettingsClient initialSettings={settings} />;
}
