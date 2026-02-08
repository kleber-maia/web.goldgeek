"use client";

import { useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { formatCurrency } from "@/lib/db/utils";
import { addItemToKit, deleteItem } from "@/lib/actions/admin/item.actions";
import { generateOffer, sendOffer } from "@/lib/actions/admin/offer.actions";
import { updateKitStatus } from "@/lib/actions/admin/kit.actions";
import { createShippingLabel } from "@/lib/actions/admin/shipping.actions";
import type { KitStatus, ItemType, MetalType, ShippingLabelType, ShippingCarrier } from "@prisma/client";

interface Kit {
  id: string;
  kitNumber: string;
  type: string;
  status: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: Date | string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
    addresses: Array<{
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
    }>;
  };
  items: Array<{
    id: string;
    description: string;
    type: string;
    metalType: string | null;
    weight: { toString(): string } | null;
    purity: string | null;
    condition: string | null;
    finalValue: { toString(): string } | null;
    estimatedValue: { toString(): string } | null;
  }>;
  offers: Array<{
    id: string;
    offerNumber: string;
    status: string;
    totalValue: { toString(): string };
  }>;
  shippingLabels: Array<{
    id: string;
    type: string;
    carrier: string;
    trackingNumber: string;
    status: string;
    labelUrl: string | null;
    createdAt: Date | string;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    description: string | null;
    createdAt: Date | string;
  }>;
  shippingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

const pricePerGram: Record<string, number> = {
  "10K": 26.50,
  "14K": 37.00,
  "18K": 47.50,
  "22K": 58.00,
  "24K": 63.00,
  "sterling": 0.85,
  "platinum": 32.00,
};

// Status workflow: what comes next
const STATUS_FLOW: Record<string, { next: string; label: string; description: string } | null> = {
  PENDING: { next: "KIT_SENT", label: "Mark Kit Sent", description: "Kit/label has been mailed to customer" },
  KIT_SENT: { next: "IN_TRANSIT", label: "Mark In Transit", description: "Customer shipped their package" },
  IN_TRANSIT: { next: "RECEIVED", label: "Mark Received", description: "Package arrived at Gold Geek" },
  RECEIVED: { next: "EVALUATING", label: "Start Evaluation", description: "Begin evaluating items" },
  EVALUATING: null, // Next step is handled by offer flow
  OFFER_SENT: null, // Waiting for customer
  ACCEPTED: null, // Payment flow
  DECLINED: null, // Return flow
  PAID: null,
  RETURNED: null,
  CANCELLED: null,
};

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
    case "OFFER_SENT":
      return "pending";
    case "KIT_SENT":
      return "purple";
    case "IN_TRANSIT":
    case "RECEIVED":
    case "EVALUATING":
      return "in-progress";
    case "ACCEPTED":
    case "PAID":
      return "success";
    case "DECLINED":
    case "CANCELLED":
      return "danger";
    case "RETURNED":
      return "gray";
    default:
      return "gray";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Statuses where items can be added/deleted
const ITEM_EDITABLE_STATUSES = ["RECEIVED", "EVALUATING"];

export default function RequestDetailClient({ kit: initialKit }: { kit: Kit }) {
  const [kit] = useState(initialKit);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [itemType, setItemType] = useState("JEWELRY");
  const [itemDescription, setItemDescription] = useState("");
  const [metalType, setMetalType] = useState("GOLD");
  const [itemWeight, setItemWeight] = useState("");
  const [itemPurity, setItemPurity] = useState("14K");
  const [itemCondition, setItemCondition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shipping label form state
  const [labelCarrier, setLabelCarrier] = useState("FEDEX");
  const [labelType, setLabelType] = useState("INBOUND");
  const [labelTracking, setLabelTracking] = useState("");
  const [labelUrl, setLabelUrl] = useState("");
  const [labelCost, setLabelCost] = useState("");

  const estimatedValue = itemWeight && itemPurity
    ? (parseFloat(itemWeight) * (pricePerGram[itemPurity] || 0)).toFixed(2)
    : "0.00";

  const canEditItems = ITEM_EDITABLE_STATUSES.includes(kit.status);
  const nextStatus = STATUS_FLOW[kit.status];
  const latestOffer = kit.offers && kit.offers.length > 0 ? kit.offers[0] : null;
  const shippingAddress = kit.shippingAddress || kit.customer.addresses[0];

  // --- Handlers ---

  const handleStatusChange = async () => {
    if (!nextStatus) return;
    if (!confirm(`${nextStatus.label}?\n\n${nextStatus.description}`)) return;

    setIsSubmitting(true);
    try {
      const result = await updateKitStatus(kit.id, nextStatus.next as KitStatus);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addItemToKit(kit.id, {
        type: itemType as ItemType,
        description: itemDescription,
        metalType: metalType as MetalType,
        weight: parseFloat(itemWeight),
        purity: itemPurity,
        quantity: 1,
        condition: itemCondition,
        finalValue: parseFloat(estimatedValue),
      });

      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;

    setIsSubmitting(true);
    try {
      const result = await deleteItem(itemId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateOffer = async () => {
    if (!confirm("Generate offer from current items?")) return;

    setIsSubmitting(true);
    try {
      const result = await generateOffer(kit.id);
      if (result.success) {
        alert("Offer generated successfully!");
        window.location.reload();
      } else {
        alert(result.error || "Failed to generate offer");
      }
    } catch (error) {
      console.error("Error generating offer:", error);
      alert("Failed to generate offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOffer = async (offerId: string) => {
    if (!confirm("Send this offer to the customer?")) return;

    setIsSubmitting(true);
    try {
      const result = await sendOffer(offerId);
      if (result.success) {
        alert("Offer sent successfully!");
        window.location.reload();
      } else {
        alert(result.error || "Failed to send offer");
      }
    } catch (error) {
      console.error("Error sending offer:", error);
      alert("Failed to send offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelTracking.trim()) {
      alert("Tracking number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createShippingLabel({
        kitId: kit.id,
        type: labelType as ShippingLabelType,
        carrier: labelCarrier as ShippingCarrier,
        trackingNumber: labelTracking.trim(),
        labelUrl: labelUrl.trim() || undefined,
        cost: labelCost ? parseFloat(labelCost) : undefined,
      });

      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "Failed to create shipping label");
      }
    } catch (error) {
      console.error("Error creating label:", error);
      alert("Failed to create shipping label");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main" style={{ paddingBottom: "100px" }}>
        {/* Header */}
        <div className="admin-detail-header">
          <Link href="/admin/requests" className="admin-back-btn">
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 className="admin-detail-title">{kit.kitNumber}</h1>
            <span className={`admin-badge ${getStatusBadgeClass(kit.status)}`} style={{ marginTop: "4px" }}>
              {formatStatus(kit.status)}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STATUS & ACTIONS                                             */}
        {/* ============================================================ */}
        <div className="admin-section">
          <div className="admin-section-title">Status & Actions</div>

          {/* Status progression bar */}
          <div style={{ display: "flex", gap: "4px", margin: "12px 0 16px", flexWrap: "wrap" }}>
            {["PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED", "EVALUATING", "OFFER_SENT"].map((s) => {
              const allStatuses = ["PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED", "EVALUATING", "OFFER_SENT", "ACCEPTED", "DECLINED", "PAID", "RETURNED", "CANCELLED"];
              const currentIdx = allStatuses.indexOf(kit.status);
              const thisIdx = allStatuses.indexOf(s);
              const isPast = thisIdx < currentIdx;
              const isCurrent = s === kit.status;

              return (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    minWidth: "40px",
                    height: "6px",
                    borderRadius: "3px",
                    background: isCurrent
                      ? "#AD7B2A"
                      : isPast
                      ? "#10B981"
                      : "#E5E7EB",
                  }}
                  title={formatStatus(s)}
                />
              );
            })}
          </div>

          <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "12px" }}>
            Current: <strong style={{ color: "#2E1F0C" }}>{formatStatus(kit.status)}</strong>
            {kit.type && <> &bull; {kit.type.charAt(0) + kit.type.slice(1).toLowerCase()} Kit</>}
            {kit.trackingNumber && <> &bull; Tracking: <code style={{ fontSize: "12px" }}>{kit.trackingNumber}</code></>}
          </div>

          {/* Next status button */}
          {nextStatus && (
            <button
              onClick={handleStatusChange}
              className="admin-btn admin-btn-primary"
              disabled={isSubmitting}
              style={{ width: "100%" }}
            >
              <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              {isSubmitting ? "Updating..." : nextStatus.label}
            </button>
          )}

          {/* Info when waiting for external action */}
          {kit.status === "OFFER_SENT" && (
            <div style={{ padding: "12px", background: "#FEF3C7", borderRadius: "8px", fontSize: "14px", color: "#92400E" }}>
              Waiting for customer to respond to the offer.
            </div>
          )}
          {kit.status === "ACCEPTED" && (
            <div style={{ padding: "12px", background: "#D1FAE5", borderRadius: "8px", fontSize: "14px", color: "#065F46" }}>
              Customer accepted. Process payment from the <Link href="/admin/payments" style={{ color: "#065F46", fontWeight: 600 }}>Payments</Link> page.
            </div>
          )}
          {kit.status === "DECLINED" && (
            <div style={{ padding: "12px", background: "#FEE2E2", borderRadius: "8px", fontSize: "14px", color: "#991B1B" }}>
              Customer declined. Process return from the <Link href="/admin/returns" style={{ color: "#991B1B", fontWeight: 600 }}>Returns</Link> page.
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SHIPPING LABELS                                              */}
        {/* ============================================================ */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">
              Shipping Labels ({kit.shippingLabels?.length || 0})
            </h2>
            <button
              onClick={() => setIsCreatingLabel(!isCreatingLabel)}
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: "13px", padding: "6px 12px" }}
            >
              {isCreatingLabel ? "Cancel" : "+ Create Label"}
            </button>
          </div>

          {/* Create Label Form */}
          {isCreatingLabel && (
            <form onSubmit={handleCreateLabel} style={{ marginTop: "12px", marginBottom: "16px" }}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Type</label>
                  <select
                    className="admin-form-input"
                    value={labelType}
                    onChange={(e) => setLabelType(e.target.value)}
                  >
                    <option value="INBOUND">Inbound (Customer → Gold Geek)</option>
                    <option value="RETURN">Return (Gold Geek → Customer)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Carrier</label>
                  <select
                    className="admin-form-input"
                    value={labelCarrier}
                    onChange={(e) => setLabelCarrier(e.target.value)}
                  >
                    <option value="FEDEX">FedEx</option>
                    <option value="USPS">USPS</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Tracking Number *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={labelTracking}
                  onChange={(e) => setLabelTracking(e.target.value)}
                  placeholder="e.g., 794644790132"
                  required
                />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Label URL (optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={labelUrl}
                    onChange={(e) => setLabelUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Cost (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="admin-form-input"
                    value={labelCost}
                    onChange={(e) => setLabelCost(e.target.value)}
                    placeholder="12.50"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Label"}
              </button>
            </form>
          )}

          {/* Existing Labels */}
          {kit.shippingLabels && kit.shippingLabels.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              {kit.shippingLabels.map((label) => (
                <div
                  key={label.id}
                  style={{
                    padding: "12px",
                    background: "#FFFDF7",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#2E1F0C" }}>
                        {label.carrier} &bull; {label.type === "INBOUND" ? "Inbound" : "Return"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6B7280", fontFamily: "monospace", marginTop: "2px" }}>
                        {label.trackingNumber}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`admin-badge ${
                        label.status === "DELIVERED" ? "success" :
                        label.status === "IN_TRANSIT" ? "in-progress" :
                        label.status === "VOIDED" ? "danger" : "gray"
                      }`} style={{ fontSize: "11px" }}>
                        {formatStatus(label.status)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                    Created {formatDate(label.createdAt)}
                    {label.labelUrl && (
                      <> &bull; <a href={label.labelUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#AD7B2A" }}>View Label</a></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isCreatingLabel && (
              <div style={{ padding: "16px", textAlign: "center", color: "#6B7280", fontSize: "14px", marginTop: "8px" }}>
                No shipping labels created yet
              </div>
            )
          )}
        </div>

        {/* ============================================================ */}
        {/* CUSTOMER INFO                                                */}
        {/* ============================================================ */}
        <div className="admin-section">
          <div className="admin-section-title">Customer Information</div>
          <div className="admin-info-grid">
            <div>
              <div className="admin-info-label">Name</div>
              <div className="admin-info-value">
                <Link href={`/admin/customers/${kit.customer.id}`} style={{ color: "#AD7B2A", textDecoration: "none" }}>
                  {kit.customer.firstName} {kit.customer.lastName}
                </Link>
              </div>
            </div>
            <div>
              <div className="admin-info-label">Email</div>
              <div className="admin-info-value">{kit.customer.email}</div>
            </div>
            <div>
              <div className="admin-info-label">Phone</div>
              <div className="admin-info-value">{kit.customer.phone || "N/A"}</div>
            </div>
            <div>
              <div className="admin-info-label">Address</div>
              <div className="admin-info-value">
                {shippingAddress ? (
                  <>
                    {shippingAddress.street1}<br />
                    {shippingAddress.street2 && <>{shippingAddress.street2}<br /></>}
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                  </>
                ) : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ITEMS                                                        */}
        {/* ============================================================ */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Items ({kit.items.length})</h2>
            {canEditItems && (
              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: "13px", padding: "6px 12px" }}
              >
                {isAddingItem ? "Cancel" : "+ Add Item"}
              </button>
            )}
          </div>

          {/* Add Item Form */}
          {isAddingItem && (
            <form onSubmit={handleAddItem} className="admin-form" style={{ marginTop: "12px", marginBottom: "16px" }}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Item Type</label>
                  <select
                    className="admin-form-input"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    required
                  >
                    <option value="JEWELRY">Jewelry</option>
                    <option value="COINS">Coins</option>
                    <option value="BULLION">Bullion</option>
                    <option value="SCRAP">Scrap</option>
                    <option value="WATCHES">Watches</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Metal Type</label>
                  <select
                    className="admin-form-input"
                    value={metalType}
                    onChange={(e) => setMetalType(e.target.value)}
                    required
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="PALLADIUM">Palladium</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g., 14K Gold Ring"
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Weight (grams)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="admin-form-input"
                    value={itemWeight}
                    onChange={(e) => setItemWeight(e.target.value)}
                    placeholder="5.2"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Purity</label>
                  <select
                    className="admin-form-input"
                    value={itemPurity}
                    onChange={(e) => setItemPurity(e.target.value)}
                    required
                  >
                    <option value="10K">10K</option>
                    <option value="14K">14K</option>
                    <option value="18K">18K</option>
                    <option value="22K">22K</option>
                    <option value="24K">24K</option>
                    <option value="sterling">Sterling Silver</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Estimated Value</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={`$${estimatedValue}`}
                    readOnly
                    style={{ backgroundColor: "#f3f4f6" }}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Condition (optional)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value)}
                  placeholder="e.g., Good, Excellent"
                />
              </div>

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Item"}
              </button>
            </form>
          )}

          {/* Items List */}
          <div className="admin-items-list">
            {kit.items.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                No items added yet
                {canEditItems && (
                  <div style={{ marginTop: "8px", fontSize: "13px" }}>
                    Click &quot;+ Add Item&quot; above to start adding items.
                  </div>
                )}
              </div>
            ) : (
              kit.items.map((item) => (
                <div key={item.id} className="admin-item-card">
                  <div className="admin-item-header">
                    <div>
                      <div className="admin-item-name">{item.description}</div>
                      <div className="admin-item-meta">
                        {item.metalType} {item.weight && `\u2022 ${parseFloat(item.weight.toString())}g`} {item.purity && `\u2022 ${item.purity}`}
                        {item.condition && ` \u2022 ${item.condition}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="admin-item-value">
                        {formatCurrency(parseFloat(item.finalValue?.toString() || item.estimatedValue?.toString() || "0"))}
                      </div>
                      {canEditItems && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{
                            marginTop: "4px",
                            color: "#DC2626",
                            fontSize: "12px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Generate Offer Button */}
          {kit.items.length > 0 && kit.status === "EVALUATING" && !latestOffer && (
            <button
              onClick={handleGenerateOffer}
              className="admin-btn admin-btn-primary"
              style={{ marginTop: "16px", width: "100%" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating..." : "Generate Offer"}
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* OFFER                                                        */}
        {/* ============================================================ */}
        {latestOffer && (
          <div className="admin-section">
            <div className="admin-section-title">Current Offer</div>
            <div className="admin-offer-card">
              <div className="admin-offer-header">
                <div>
                  <Link href={`/admin/offers/${latestOffer.id}`} style={{ textDecoration: "none" }}>
                    <div className="admin-offer-number">{latestOffer.offerNumber}</div>
                  </Link>
                  <div className="admin-offer-status">
                    <span className={`admin-badge ${
                      latestOffer.status === "SENT" ? "pending" :
                      latestOffer.status === "ACCEPTED" ? "success" :
                      latestOffer.status === "DECLINED" ? "danger" :
                      latestOffer.status === "DRAFT" ? "gray" : "gray"
                    }`}>
                      {formatStatus(latestOffer.status)}
                    </span>
                  </div>
                </div>
                <div className="admin-offer-amount">
                  {formatCurrency(parseFloat(latestOffer.totalValue.toString()))}
                </div>
              </div>
              {latestOffer.status === "DRAFT" && (
                <button
                  onClick={() => handleSendOffer(latestOffer.id)}
                  className="admin-btn admin-btn-primary"
                  style={{ marginTop: "12px", width: "100%" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Offer to Customer"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TIMELINE                                                     */}
        {/* ============================================================ */}
        <div className="admin-section">
          <div className="admin-section-title">Timeline</div>
          <div className="admin-timeline">
            {kit.timeline.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                No timeline events
              </div>
            ) : (
              kit.timeline.map((event) => (
                <div key={event.id} className="admin-timeline-item">
                  <div className="admin-timeline-dot"></div>
                  <div className="admin-timeline-content">
                    <div className="admin-timeline-title">{event.title}</div>
                    {event.description && (
                      <div className="admin-timeline-desc">{event.description}</div>
                    )}
                    <div className="admin-timeline-date">{formatDate(event.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
