import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getCompanySettings } from "@/lib/actions/admin/settings.actions";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getCompanySettings();
  const settings = result.data ?? null;

  const integrations = {
    fedex: {
      clientId: !!process.env.FEDEX_CLIENT_ID,
      clientSecret: !!process.env.FEDEX_CLIENT_SECRET,
      accountNumber: !!process.env.FEDEX_ACCOUNT_NUMBER,
      sandboxMode: process.env.FEDEX_SANDBOX_MODE === "true",
    },
    resend: {
      apiKey: !!process.env.RESEND_API_KEY,
      emailFrom: process.env.EMAIL_FROM || "",
    },
  };

  return <SettingsClient initialSettings={settings} integrations={integrations} />;
}
