import { formatCurrency, formatDate } from "@/lib/account";

interface OfferBannerProps {
  amount: number;
  expiresAt?: string | Date;
}

export default function OfferBanner({ amount, expiresAt }: OfferBannerProps) {
  return (
    <div className="account-offer-banner">
      <div className="account-offer-label">Your Offer</div>
      <div className="account-offer-amount">{formatCurrency(amount)}</div>
      {expiresAt && (
        <div className="account-offer-expires">Expires: {formatDate(expiresAt)}</div>
      )}
    </div>
  );
}
