import KitDestination from "@/components/account/KitDestination";
import { canPrepareDigitalKit, hasAccessedDigitalKit, isActionableOffer, compareOffers } from '@/lib/account/kit-policy';
import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountContainer, Badge, Timeline, OfferBanner, KitTypeToggle } from "@/components/account";
import { getSession } from "@/lib/auth";
import AccessDenied from "@/components/AccessDenied";
import { getKitDetails } from "@/lib/actions/customer.actions";
import { formatCurrency, formatWeight } from "@/lib/db/utils";
import { formatDate, formatCustomerKitStatus } from "@/lib/account";
import { itemBreakdownSchema } from "@/lib/validators/offer";
import { SettingsService } from "@/lib/services/settings.service";

type OfferLike = {
  id: string;
  status: string;
  itemBreakdown: unknown;
  payment?: { status: string } | null;
  totalValue: { toString(): string };
  expiresAt?: string | null;
  createdAt: string;
  sentAt?: string | null;
};

type TimelineLike = {
  title: string;
  createdAt: string;
  description?: string | null;
};

type ItemLike = {
  id: string;
  description: string;
  type: string;
  metalType: string | null;
  weight: { toString(): string } | null;
  purity: string | null;
  finalValue: { toString(): string } | null;
  quantity?: number;
};

type ShippingLabelLike = {
  id: string;
  type: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
};

function formatMetalInfo(metalType: string | null, purity: string | null): string {
  if (!metalType && !purity) return "";
  const metal = metalType
    ? metalType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
  if (metal && purity) return `${metal} - ${purity}`;
  return metal || purity || "";
}

function formatLabelType(type: string, companyName: string): string {
  switch (type) {
    case "INBOUND":
      return `Shipping to ${companyName}`;
    case "KIT_DELIVERY":
      return "Kit Delivery";
    case "RETURN":
      return "Return Shipment";
    default:
      return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function formatLabelStatus(status: string): { label: string; badgeClass: string } {
  switch (status) {
    case "PENDING":
      return { label: "Pending", badgeClass: "pending" };
    case "CREATED":
      return { label: "Label Created", badgeClass: "purple" };
    case "IN_TRANSIT":
      return { label: "In Transit", badgeClass: "in-progress" };
    case "DELIVERED":
      return { label: "Delivered", badgeClass: "success" };
    case "CANCELLED":
      return { label: "Cancelled", badgeClass: "gray" };
    default:
      return {
        label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        badgeClass: "gray",
      };
  }
}

function formatReturnStatus(status: string): { label: string; badgeClass: string } {
  switch (status) {
    case "PENDING":
      return { label: "Pending", badgeClass: "pending" };
    case "LABEL_CREATED":
      return { label: "Label Created", badgeClass: "purple" };
    case "IN_TRANSIT":
      return { label: "In Transit", badgeClass: "in-progress" };
    case "DELIVERED":
      return { label: "Delivered", badgeClass: "success" };
    default:
      return {
        label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        badgeClass: "gray",
      };
  }
}

export default async function KitDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const backHref = returnTo && /^\/account\/kits(?:\?|$)/.test(returnTo) ? returnTo : "/account/kits";
  const session = await getSession();

  if (!session) {
    redirect("/account/login");
  }

  if (session.type !== "customer") {
    return <AccessDenied userType={session.type} />;
  }

  const result = await getKitDetails(id);

  if (!result.success || !result.data) {
    throw new Error("Unable to load this kit. Please try again.");
  }

  const kit = result.data;
  const company = await SettingsService.getCompanyInfo();

  const offers = ((kit.offers || []) as OfferLike[]).filter(offer => offer.status !== "DRAFT");
  const sortedOffers = [...offers].sort(compareOffers);
  const activeOffer =
    sortedOffers.find((offer) => offer.status === "SENT") ||
    sortedOffers[0] ||
    null;

  const showOfferBanner =
    kit.status === "OFFER_SENT" && isActionableOffer(activeOffer);
  const hasLabels = (kit.shippingLabels || []).length > 0;
  const canChangeType = ["PENDING", "SHIPPED"].includes(kit.status) && !hasLabels;
  const showShippingLabel =
    canPrepareDigitalKit(kit);
  const showPhysicalKitMessage =
    kit.type === "PHYSICAL" && kit.status === "SHIPPED";

  const timelineEvents =
    (kit.timeline as TimelineLike[] | undefined)?.map((event) => ({
      event: event.title,
      date: event.createdAt,
      description: event.description || undefined,
    })) || [];

  // Item/Offer breakdown data
  const items = (kit.items || []) as ItemLike[];
  const snapshot = itemBreakdownSchema.array().safeParse(activeOffer?.itemBreakdown);
  const evaluatedItems: ItemLike[] = activeOffer && snapshot.success ? snapshot.data.map((entry) => ({ id: entry.itemId, description: entry.description, quantity: entry.quantity || 1, type: 'OTHER', metalType: null, weight: null, purity: null, finalValue: entry.value })) : items.map(item => ({ ...item, finalValue: null }));
  const showItemBreakdown = evaluatedItems.length > 0;
  const itemsTotal = activeOffer ? Number(activeOffer.totalValue.toString()) : 0;

  // Shipping labels
  const shippingLabels = (kit.shippingLabels || []) as ShippingLabelLike[];
  const showShippingTracking = shippingLabels.length > 0;

  // Returns
  const returns = kit.returns || [];
  const showReturnTracking =
    returns.length > 0 &&
    ["DECLINED", "RETURNED"].includes(kit.status);

  return (
    <AccountContainer
      headerProps={{
        showBackButton: true,
        backHref,
        title: `Kit ${kit.kitNumber}`,
      }}
    >
      <Link href={backHref} className="hidden md:inline-block underline mb-4">Back to kits</Link>
      {kit.status === 'DECLINED' && <KitDestination kitId={kit.id} address={kit.shippingAddress && typeof kit.shippingAddress === 'object' && !Array.isArray(kit.shippingAddress) ? ['street1', 'street2', 'city', 'state', 'zipCode', 'country'].map(key => kit.shippingAddress && typeof kit.shippingAddress === 'object' && !Array.isArray(kit.shippingAddress) ? kit.shippingAddress[key] : '').filter(Boolean).join(', ') : 'No destination saved'} />}
      {/* Status Badge */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Badge
          status={kit.status.toLowerCase()}
          label={kit.status === 'OFFER_SENT' && !showOfferBanner ? 'Awaiting updated offer' : activeOffer?.payment?.status === 'COMPLETED' ? 'Payment Completed' : formatCustomerKitStatus(kit)}
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

      {/* Expired Offer Banner */}
      {activeOffer?.status === "EXPIRED" && (
        <div style={{
          background: "#F3F4F6",
          border: "1px solid #D1D5DB",
          borderRadius: "10px",
          padding: "16px",
          textAlign: "center",
          marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 600, color: "#6B7280" }}>
            Offer Expired
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>
            The offer of {formatCurrency(parseFloat(activeOffer.totalValue.toString()))} has expired.
            {company.supportEmail ? <>Contact us at {company.supportEmail} to discuss your items.</> : <>Contact us to discuss your items.</>}
          </p>
        </div>
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
          {activeOffer?.payment?.status === "FAILED" ? "Payment needs attention. Our team will follow up; you do not need to accept again." : activeOffer?.payment?.status === "PROCESSING" ? "Your payment is being processed." : "Offer accepted. Your payment is queued."}
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
          {activeOffer.payment?.status === "COMPLETED" ? "Payment completed:" : "Payment sent:"}{" "}
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
        {canChangeType && <KitTypeToggle kitId={kit.id} currentType={kit.type} />}
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

      {showShippingLabel && (
        <section className="account-section">
          <h2 className="text-base font-semibold mb-2">{hasAccessedDigitalKit(kit) ? "Next: pack and drop off" : "Prepare your shipment"}</h2>
          <p className="text-sm mb-4">Place your items and the printed customer information card inside a sturdy package. Attach the prepaid label and take the package to a staffed FedEx location. Keep your drop-off receipt.</p>
          <div className="flex flex-col md:flex-row gap-3">
            <Link href={`/account/kit/${kit.id}/digital-kit`} className="account-btn account-btn-primary">
              {hasAccessedDigitalKit(kit) ? "View or reprint kit" : "Get your digital kit"}
            </Link>
            <a href="https://local.fedex.com/en/staffed-drop-off" target="_blank" rel="noopener noreferrer" className="account-btn account-btn-secondary">Find a drop-off location</a>
          </div>
          <p className="text-sm mt-3 mb-0">Tracking updates after FedEx scans your package.</p>
        </section>
      )}

      {/* Kit Summary */}
      <div className="account-section">
        <div className="account-section-title">Kit Summary</div>
        <div className="account-kit-summary">
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Total Items</span>
            <span className="account-kit-summary-value">
              {items.reduce((total, item) => total + (item.quantity || 1), 0)} items
            </span>
          </div>
          <div className="account-kit-summary-row">
            <span className="account-kit-summary-label">Kit Type</span>
            <span className="account-kit-summary-value">
              {kit.type === "PHYSICAL" ? "Physical Kit" : "Digital"}
            </span>
          </div>
          {kit.estimatedValue && (
            <div className="account-kit-summary-row">
              <span className="account-kit-summary-label">Estimated Value</span>
              <span className="account-kit-summary-value" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
                {formatCurrency(parseFloat(kit.estimatedValue.toString()))}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Shipping Tracking */}
      {showShippingTracking && (
        <div className="account-section">
          <div className="account-section-title">Shipping</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {shippingLabels.map((label) => {
              const statusInfo = formatLabelStatus(label.status);
              return (
                <div
                  key={label.id}
                  style={{
                    background: "var(--account-bg)",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--brand-secondary)",
                      }}
                    >
                      {formatLabelType(label.type, company.name)}
                    </span>
                    <span
                      className={`account-badge ${statusInfo.badgeClass}`}
                      style={{ fontSize: 11 }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "var(--status-gray)" }}>
                      {label.carrier}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "var(--brand-text)",
                      }}
                    >
                      {label.trackingNumber}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--status-gray)",
                      marginTop: 6,
                    }}
                  >
                    Created {formatDate(label.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Item / Offer Breakdown */}
      {showItemBreakdown && (
        <div className="account-section">
          <div className="account-section-title">Appraisal Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {evaluatedItems.map((item) => {
              const metalInfo = formatMetalInfo(item.metalType, item.purity);
              const weight = item.weight
                ? parseFloat(item.weight.toString())
                : null;
              const value = item.finalValue == null ? 0 : Number(item.finalValue.toString());

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--account-border)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--brand-text)",
                        marginBottom: 2,
                      }}
                    >
                      {item.description}{(item.quantity || 1) > 1 ? ` × ${item.quantity}` : ""}
                    </div>
                    {metalInfo && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--status-gray)",
                        }}
                      >
                        {metalInfo}
                      </div>
                    )}
                    {weight !== null && weight > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--status-gray)",
                        }}
                      >
                        {formatWeight(weight)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--brand-secondary)",
                      marginLeft: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activeOffer ? formatCurrency(value) : "Awaiting appraisal"}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--brand-text)",
              }}
            >
              {activeOffer ? "Total Appraised Value" : "Inventory recorded"}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--brand-primary)",
              }}
            >
              {activeOffer ? formatCurrency(itemsTotal) : `${evaluatedItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items`}
            </span>
          </div>
        </div>
      )}

      {/* Return Tracking */}
      {showReturnTracking && (
        <div className="account-section">
          <div className="account-section-title">Return Tracking</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {returns.map((ret) => {
              const statusInfo = formatReturnStatus(ret.status);
              return (
                <div
                  key={ret.id}
                  style={{
                    background: "var(--account-bg)",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--brand-secondary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {ret.returnNumber}
                    </span>
                    <span
                      className={`account-badge ${statusInfo.badgeClass}`}
                      style={{ fontSize: 11 }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  {ret.trackingNumber && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: "var(--status-gray)" }}>
                        Tracking
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "var(--brand-text)",
                        }}
                      >
                        {ret.trackingNumber}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 11,
                      color: "var(--status-gray)",
                      marginTop: 4,
                    }}
                  >
                    <span>Created {formatDate(ret.createdAt)}</span>
                    {ret.shippedAt && (
                      <span>Shipped {formatDate(ret.shippedAt)}</span>
                    )}
                    {ret.deliveredAt && (
                      <span>Delivered {formatDate(ret.deliveredAt)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="account-section">
        <div className="account-section-title">Timeline</div>
        <Timeline events={timelineEvents} />
      </div>
    </AccountContainer>
  );
}
