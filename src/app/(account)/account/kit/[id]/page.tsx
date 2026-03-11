import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountContainer, Badge, Timeline, OfferBanner, KitTypeToggle } from "@/components/account";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getKitDetails } from "@/lib/actions/customer.actions";
import { formatCurrency } from "@/lib/db/utils";

type OfferLike = {
  id: string;
  status: string;
  totalValue: { toString(): string };
  expiresAt?: Date | null;
  createdAt: Date;
};

type TimelineLike = {
  title: string;
  createdAt: Date;
  description?: string | null;
};

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getKitDetails(id);

  if (!result.success || !result.data) {
    redirect("/account");
  }

  const kit = result.data as any;

  const offers = (kit.offers || []) as OfferLike[];
  const sortedOffers = [...offers].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const activeOffer =
    sortedOffers.find((offer) => offer.status === "SENT") ||
    sortedOffers[0] ||
    null;

  const showOfferBanner =
    kit.status === "OFFER_SENT" && activeOffer?.status === "SENT";
  const hasLabels = (kit.shippingLabels || []).length > 0;
  const canChangeType = ["PENDING", "KIT_SENT"].includes(kit.status) && !hasLabels;
  const showShippingLabel =
    kit.type === "DIGITAL" && ["PENDING", "KIT_SENT"].includes(kit.status);
  const showPhysicalKitMessage =
    kit.type === "PHYSICAL" && kit.status === "KIT_SENT";

  const timelineEvents =
    (kit.timeline as TimelineLike[] | undefined)?.map((event) => ({
      event: event.title,
      date: event.createdAt,
      description: event.description || undefined,
    })) || [];

  return (
    <AccountContainer
      headerProps={{
        showBackButton: true,
        backHref: "/account",
        title: `Kit ${kit.kitNumber}`,
      }}
    >
      {/* Status Badge */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Badge
          status={kit.status.toLowerCase()}
          style={{ fontSize: 14, padding: "8px 16px" }}
        />
      </div>

      {/* Offer Banner */}
      {showOfferBanner && activeOffer && (
        <>
          <OfferBanner
            amount={parseFloat(activeOffer.totalValue.toString())}
            expiresAt={activeOffer.expiresAt ?? undefined}
          />
          <div className="account-offer-actions">
            <Link
              href={`/account/kit/${kit.id}/accept`}
              className="account-btn account-btn-success"
            >
              Accept Offer
            </Link>
            <Link
              href={`/account/kit/${kit.id}/decline`}
              className="account-btn account-btn-secondary"
            >
              Decline
            </Link>
          </div>
          <div style={{ height: 20 }} />
        </>
      )}

      {/* Success banners */}
      {kit.status === "ACCEPTED" && (
        <div className="account-success-banner">
          <svg
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Offer accepted! Payment processing...
        </div>
      )}

      {kit.status === "PAID" && activeOffer && (
        <div className="account-success-banner">
          <svg
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Payment complete:{" "}
          {formatCurrency(parseFloat(activeOffer.totalValue.toString()))}
        </div>
      )}

      {/* Kit Type Toggle */}
      <div style={{ marginBottom: 16 }}>
        {canChangeType && (
          <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", marginBottom: 8 }}>
            Choose your kit type
          </div>
        )}
        <KitTypeToggle kitId={kit.id} currentType={kit.type} disabled={!canChangeType} />
      </div>

      {/* Physical Kit Info — only after kit has been shipped */}
      {showPhysicalKitMessage && (
        <div className="account-physical-kit-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
          <div className="account-physical-kit-info-text">
            Your appraisal kit is on its way! Use the included pre-paid label
            to ship your items.
          </div>
        </div>
      )}

      {/* Digital Kit Button — only for Digital kits before shipping */}
      {showShippingLabel && (
        <Link
          href={`/account/kit/${kit.id}/digital-kit`}
          className="account-digital-kit-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
            />
          </svg>
          View Digital Kit
        </Link>
      )}

      {/* Kit Summary */}
      <div className="account-section">
        <div className="account-section-title">Kit Summary</div>
        <div className="account-kit-summary">
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Total Items</span>
            <span className="account-kit-summary-value">
              {kit.items?.length || 0} items
            </span>
          </div>
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Kit Type</span>
            <span className="account-kit-summary-value">
              {kit.type === "PHYSICAL" ? "Physical Kit" : "Digital"}
            </span>
          </div>
          {kit.trackingNumber && (
            <div className="account-kit-summary-row">
              <span className="account-kit-summary-label">Tracking</span>
              <span
                className="account-kit-summary-value"
                style={{ fontFamily: "monospace" }}
              >
                {kit.trackingNumber}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="account-section">
        <div className="account-section-title">Timeline</div>
        <Timeline events={timelineEvents} />
      </div>
    </AccountContainer>
  );
}
