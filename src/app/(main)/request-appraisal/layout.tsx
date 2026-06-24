import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a Client Component, so metadata lives in this co-located layout.
export const metadata: Metadata = pageMetadata({
  title: "Get Your Free Appraisal Kit",
  description:
    "Claim your free, fully insured appraisal kit today. Send in your gold, jewelry, or coins and get a fast, no-obligation cash offer. Quick, secure, and risk-free.",
  path: "/request-appraisal",
});

export default function RequestAppraisalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
