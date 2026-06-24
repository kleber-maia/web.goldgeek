import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a Client Component, so metadata lives in this co-located layout.
export const metadata: Metadata = pageMetadata({
  title: "What We Buy",
  description:
    "Gold Geek buys gold, jewelry, diamonds, coins, bullion, and luxury watches. See the items we accept and get a free, no-obligation appraisal.",
  path: "/what-we-buy",
});

export default function WhatWeBuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
