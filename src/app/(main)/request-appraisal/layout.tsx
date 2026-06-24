import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a Client Component, so metadata lives in this co-located layout.
export const metadata: Metadata = pageMetadata({
  title: "Request a Free Appraisal Kit",
  description:
    "Request your free, fully insured Gold Geek appraisal kit. Send in your gold, jewelry, or coins and receive a fast, no-obligation cash offer.",
  path: "/request-appraisal",
});

export default function RequestAppraisalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
