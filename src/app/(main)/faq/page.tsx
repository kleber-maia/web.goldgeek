import { SettingsService } from "@/lib/services/settings.service";
import FAQClient from "./FAQClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQ — Selling Your Gold, Answered",
  description:
    "Free appraisals, insured shipping, how offers work, and how fast you get paid — everything you need to sell your gold to Gold Geek with total confidence. Get answers here.",
  path: "/faq",
});

export default async function FAQPage() {
  const company = await SettingsService.getCompanyInfo();

  return <FAQClient companyName={company.name} phone={company.phone} />;
}
