"use client";

import Link from "next/link";
import Badge from "./Badge";
import {
  formatCurrency,
  formatDate,
  normalizeKitStatus,
  normalizeKitType,
} from "@/lib/account";

interface KitCardProps {
  kit: {
    id: string;
    kitNumber: string;
    type: string;
    status: string;
    createdAt: string | Date;
    itemCount: number;
    offerValue?: number;
    hasOffer?: boolean;
    needsShippingLabel?: boolean;
  };
}

export default function KitCard({ kit }: KitCardProps) {
  const hasOffer = Boolean(kit.hasOffer);
  const needsLabel = Boolean(kit.needsShippingLabel);
  const normalizedStatus = normalizeKitStatus(kit.status);

  let ctaText = "";
  if (hasOffer) {
    ctaText = "Review & Respond";
  } else if (needsLabel) {
    ctaText = "Print Shipping Label";
  }

  const kitTypeLabel =
    normalizeKitType(kit.type) === "physical" ? "Physical Kit" : "Digital";

  let valueDisplay = null;
  if (typeof kit.offerValue === "number") {
    if (normalizedStatus === "paid") {
      valueDisplay = (
        <span className="account-kit-value">
          Received: {formatCurrency(kit.offerValue)}
        </span>
      );
    } else if (hasOffer) {
      valueDisplay = (
        <span className="account-kit-value">
          Offer: {formatCurrency(kit.offerValue)}
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
          <div className="account-kit-id">Kit #{kit.kitNumber}</div>
          <div className="account-kit-type">
            {kitTypeLabel} &bull; {kit.itemCount ?? "?"} items
          </div>
        </div>
        <Badge status={kit.status} />
      </div>

      {valueDisplay}

      {ctaText && <div className="account-kit-cta">{ctaText} &rarr;</div>}

      <div className="account-kit-card-footer">
        <span className="account-kit-date">{formatDate(kit.createdAt)}</span>
        <span
          className={`account-kit-type-badge ${normalizeKitType(kit.type)}`}
        >
          {normalizeKitType(kit.type)}
        </span>
      </div>
    </Link>
  );
}
