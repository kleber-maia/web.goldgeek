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
  returnTo?: string;
  kit: {
    id: string;
    kitNumber: string;
    type: string;
    status: string;
    statusLabel: string;
    createdAt: string | Date;
    itemCount: number;
    offerValue?: number;
    hasOffer?: boolean;
    needsShippingLabel?: boolean;
  };
}

export default function KitCard({ kit, returnTo }: KitCardProps) {
  const hasOffer = Boolean(kit.hasOffer);
  const needsLabel = Boolean(kit.needsShippingLabel);
  const normalizedStatus = normalizeKitStatus(kit.status);

  let ctaText = "";
  if (hasOffer) {
    ctaText = "Review & Respond";
  } else if (needsLabel) {
    ctaText = "View Digital Kit";
  }

  const kitTypeLabel =
    normalizeKitType(kit.type) === "physical" ? "Physical Kit" : "Digital";

  let valueDisplay = null;
  if (typeof kit.offerValue === "number") {
    if (normalizedStatus === "paid") {
      valueDisplay = (
        <span className="account-kit-value">
          Payment sent: {formatCurrency(kit.offerValue)}
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
      href={`/account/kit/${kit.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
      className={`account-kit-card ${hasOffer ? "highlight" : ""}`}
    >
      <div className="account-kit-card-header flex-col gap-2 md:flex-row">
        <div>
          <div className="account-kit-id">Kit #{kit.kitNumber}</div>
          <div className="account-kit-type">
            {kitTypeLabel} &bull; {kit.itemCount ?? "?"} {kit.itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>
        <Badge className="max-w-full whitespace-normal md:text-right" status={kit.status} label={kit.statusLabel} />
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
