import { SettingsService } from "@/lib/services/settings.service";
import FAQClient from "./FAQClient";

export default async function FAQPage() {
  const company = await SettingsService.getCompanyInfo();

  return <FAQClient companyName={company.name} phone={company.phone} />;
}
