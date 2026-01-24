"use client";

import Link from "next/link";
import Badge from "./Badge";
import {
  Kit,
  KitSummary,
  formatCurrency,
  formatDate,
  generateKitNumber,
  hasPendingOffer,
  needsShippingLabel,
  getKitSummary,
} from "@/lib/account";

interface KitCardProps {
  kit: Kit & { timeline: { event: string; date: string }[] };
}

export default function KitCard({ kit }: KitCardProps) {
  const summary = getKitSummary(kit.id);
  const hasOffer = hasPendingOffer(kit);
  const needsLabel = needsShippingLabel(kit);

  let ctaText = "";
  if (hasOffer) {
    ctaText = "Review & Respond";
  } else if (needsLabel) {
    ctaText = "Print Shipping Label";
  }

  const kitTypeLabel = kit.kitType === "physical" ? "Physical Kit" : "Digital";

  let valueDisplay = null;
  if (summary?.offer?.totalValue) {
    if (kit.status === "paid") {
      valueDisplay = (
        <span className="account-kit-value">
          Received: {formatCurrency(summary.offer.totalValue)}
        </span>
      );
    } else if (hasOffer) {
      valueDisplay = (
        <span className="account-kit-value">
          Offer: {formatCurrency(summary.offer.totalValue)}
        </span>
      );
    }
  }

  return (
    <Link
      href={`/account/kit/${kit.id}`}
      className={`account-kit-card ${hasOffer ? "highlight" : ""}`}
    >
      <div className="account-kit-card-header">
        <div>
          <div className="account-kit-id">Kit #{generateKitNumber(kit.id)}</div>
          <div className="account-kit-type">
            {kitTypeLabel} &bull; {summary?.itemCount || "?"} items
          </div>
        </div>
        <Badge status={kit.status} />
      </div>

      {valueDisplay}

      {ctaText && <div className="account-kit-cta">{ctaText} &rarr;</div>}

      <div className="account-kit-card-footer">
        <span className="account-kit-date">{formatDate(kit.createdAt)}</span>
        <span className={`account-kit-type-badge ${kit.kitType}`}>
          {kit.kitType}
        </span>
      </div>
    </Link>
  );
}
