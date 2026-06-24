import { SettingsService } from "@/lib/services/settings.service";
import FAQClient from "./FAQClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about selling gold, jewelry, coins, and bullion to Gold Geek — appraisals, insured shipping, offers, and getting paid.",
  path: "/faq",
});

export default async function FAQPage() {
  const company = await SettingsService.getCompanyInfo();

  return <FAQClient companyName={company.name} phone={company.phone} />;
}
