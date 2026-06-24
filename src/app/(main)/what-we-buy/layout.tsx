import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The page is a Client Component, so metadata lives in this co-located layout.
export const metadata: Metadata = pageMetadata({
  title: "What We Buy — Gold, Jewelry, Coins & More",
  description:
    "We pay top dollar for gold, jewelry, diamonds, coins, bullion & luxury watches. Not sure if yours qualifies? Get a free, no-obligation appraisal and find out fast.",
  path: "/what-we-buy",
});

export default function WhatWeBuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
