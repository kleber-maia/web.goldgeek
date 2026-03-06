"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate, formatStatus, getStatusBadgeClass } from "@/lib/admin-utils";
import { addItemToKit, updateItem, deleteItem } from "@/lib/actions/admin/item.actions";
import { generateOffer, sendOffer } from "@/lib/actions/admin/offer.actions";
import { updateKitStatus, updateKitNotes } from "@/lib/actions/admin/kit.actions";
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

// Reference prices shown as estimate only — admin always sets the actual appraised value
const estimatePricePerGram: Record<string, number> = {
  "10K": 26.50,
  "14K": 37.00,
  "18K": 47.50,
  "22K": 58.00,
  "24K": 63.00,
  "sterling": 0.85,
  "platinum": 32.00,
};

// Status workflow: what comes next for linear progression
const STATUS_FLOW: Record<string, { next: string; label: string; description: string } | null> = {
  PENDING: { next: "KIT_SENT", label: "Mark Kit Sent", description: "Kit/label has been mailed to customer" },
  KIT_SENT: { next: "IN_TRANSIT", label: "Mark In Transit", description: "Customer shipped their package" },
  IN_TRANSIT: { next: "RECEIVED", label: "Mark Received", description: "Package arrived at Gold Geek" },
  RECEIVED: { next: "EVALUATING", label: "Start Evaluation", description: "Begin evaluating items" },
  EVALUATING: null,
  OFFER_SENT: null,
  ACCEPTED: null,
  DECLINED: null,
  PAID: null,
  RETURNED: null,
  CANCELLED: null,
};

// Full ordered workflow for the progress bar
const WORKFLOW_STEPS = ["PENDING", "KIT_SENT", "IN_TRANSIT", "RECEIVED", "EVALUATING", "OFFER_SENT"];
const TERMINAL_STATUSES = ["ACCEPTED", "PAID", "DECLINED", "RETURNED", "CANCELLED"];

const ITEM_EDITABLE_STATUSES = ["RECEIVED", "EVALUATING"];

// Inline alert component
function Alert({ type, message, onDismiss }: { type: "error" | "success"; message: string; onDismiss?: () => void }) {
  const styles: Record<string, { bg: string; color: string }> = {
    error: { bg: "#FEE2E2", color: "#991B1B" },
    success: { bg: "#D1FAE5", color: "#065F46" },
  };
  const s = styles[type];
  return (
    <div style={{ padding: "12px 16px", background: s.bg, color: s.color, borderRadius: "8px", fontSize: "14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: s.color, cursor: "pointer", fontWeight: 700, marginLeft: "8px" }}>
          ×
        </button>
      )}
    </div>
  );
}

export default function RequestDetailClient({ kit: initialKit }: { kit: Kit }) {
  const router = useRouter();
  const [kit] = useState(initialKit);

  // UI state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // Add item form state
  const [itemType, setItemType] = useState("JEWELRY");
  const [itemDescription, setItemDescription] = useState("");
  const [metalType, setMetalType] = useState("GOLD");
  const [itemWeight, setItemWeight] = useState("");
  const [itemPurity, setItemPurity] = useState("14K");
  const [itemCondition, setItemCondition] = useState("");
  const [appraisedValue, setAppraisedValue] = useState("");

  // Edit item form state (mirrors add form)
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("");
  const [editMetalType, setEditMetalType] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editPurity, setEditPurity] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editValue, setEditValue] = useState("");

  // Shipping label form state
  const [labelCarrier, setLabelCarrier] = useState("FEDEX");
  const [labelType, setLabelType] = useState("INBOUND");
  const [labelTracking, setLabelTracking] = useState("");
  const [labelUrl, setLabelUrl] = useState("");
  const [labelCost, setLabelCost] = useState("");

  // Notes state
  const [notesValue, setNotesValue] = useState(kit.notes || "");

  // Auto-estimate for the add form (reference only)
  const autoEstimate = itemWeight && itemPurity
    ? (parseFloat(itemWeight) * (estimatePricePerGram[itemPurity] || 0)).toFixed(2)
    : "";

  const canEditItems = ITEM_EDITABLE_STATUSES.includes(kit.status);
  const nextStatus = STATUS_FLOW[kit.status];
  const shippingAddress = kit.shippingAddress || kit.customer.addresses[0];

  // Active offer = latest non-declined, non-expired offer
  const activeOffer = kit.offers?.find((o) => o.status !== "DECLINED" && o.status !== "EXPIRED") || null;
  // Can generate a new offer when evaluating and no active offer exists (declined/expired don't block)
  const canGenerateOffer = kit.items.length > 0 && kit.status === "EVALUATING" && !activeOffer;

  const showFeedback = (type: "error" | "success", message: string) => {
    setFeedback({ type, message });
    if (type === "success") setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusChange = async () => {
    if (!nextStatus) return;
    setIsSubmitting(true);
    try {
      const result = await updateKitStatus(kit.id, nextStatus.next as KitStatus);
      if (result.success) {
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to update status");
      }
    } catch {
      showFeedback("error", "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appraisedValue || parseFloat(appraisedValue) <= 0) {
      showFeedback("error", "Please enter the appraised value");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addItemToKit(kit.id, {
        type: itemType as ItemType,
        description: itemDescription,
        metalType: metalType as MetalType,
        weight: itemWeight ? parseFloat(itemWeight) : undefined,
        purity: itemPurity,
        quantity: 1,
        condition: itemCondition || undefined,
        estimatedValue: autoEstimate ? parseFloat(autoEstimate) : undefined,
        finalValue: parseFloat(appraisedValue),
      });
      if (result.success) {
        setIsAddingItem(false);
        setItemDescription(""); setItemWeight(""); setItemCondition(""); setAppraisedValue("");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to add item");
      }
    } catch {
      showFeedback("error", "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditItem = (item: Kit["items"][0]) => {
    setEditingItemId(item.id);
    setEditDescription(item.description);
    setEditType(item.type);
    setEditMetalType(item.metalType || "GOLD");
    setEditWeight(item.weight ? parseFloat(item.weight.toString()).toString() : "");
    setEditPurity(item.purity || "14K");
    setEditCondition(item.condition || "");
    setEditValue(item.finalValue ? parseFloat(item.finalValue.toString()).toString() : item.estimatedValue ? parseFloat(item.estimatedValue.toString()).toString() : "");
  };

  const handleEditItem = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    if (!editValue || parseFloat(editValue) <= 0) {
      showFeedback("error", "Please enter the appraised value");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateItem(itemId, {
        description: editDescription,
        type: editType as ItemType,
        metalType: editMetalType as MetalType,
        weight: editWeight ? parseFloat(editWeight) : undefined,
        purity: editPurity || undefined,
        condition: editCondition || undefined,
        finalValue: parseFloat(editValue),
      });
      if (result.success) {
        setEditingItemId(null);
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to update item");
      }
    } catch {
      showFeedback("error", "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setIsSubmitting(true);
    try {
      const result = await deleteItem(itemId);
      if (result.success) {
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to delete item");
      }
    } catch {
      showFeedback("error", "Failed to delete item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateOffer = async () => {
    setIsSubmitting(true);
    try {
      const result = await generateOffer(kit.id);
      if (result.success) {
        showFeedback("success", "Offer generated successfully!");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to generate offer");
      }
    } catch {
      showFeedback("error", "Failed to generate offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOffer = async (offerId: string) => {
    setIsSubmitting(true);
    try {
      const result = await sendOffer(offerId);
      if (result.success) {
        showFeedback("success", "Offer sent to customer!");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to send offer");
      }
    } catch {
      showFeedback("error", "Failed to send offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelTracking.trim()) {
      showFeedback("error", "Tracking number is required");
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
        setIsCreatingLabel(false);
        setLabelTracking(""); setLabelUrl(""); setLabelCost("");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to create shipping label");
      }
    } catch {
      showFeedback("error", "Failed to create shipping label");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateKitNotes(kit.id, notesValue);
      if (result.success) {
        setIsEditingNotes(false);
        showFeedback("success", "Notes saved");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to save notes");
      }
    } catch {
      showFeedback("error", "Failed to save notes");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine progress bar state
  const isTerminal = TERMINAL_STATUSES.includes(kit.status);
  const currentStepIdx = WORKFLOW_STEPS.indexOf(kit.status);

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

        {/* Global feedback */}
        {feedback && (
          <Alert type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
        )}

        {/* ============================================================ */}
        {/* STATUS & ACTIONS                                             */}
        {/* ============================================================ */}
        <div className="admin-section">
          <div className="admin-section-title">Status & Actions</div>

          {/* Status progression bar */}
          <div style={{ display: "flex", gap: "4px", margin: "12px 0 8px", flexWrap: "wrap" }}>
            {WORKFLOW_STEPS.map((s) => {
              const isPast = currentStepIdx > WORKFLOW_STEPS.indexOf(s);
              const isCurrent = s === kit.status && !isTerminal;
              return (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    minWidth: "40px",
                    height: "6px",
                    borderRadius: "3px",
                    background: isTerminal
                      ? (["ACCEPTED", "PAID"].includes(kit.status) ? "#10B981" : ["DECLINED", "CANCELLED"].includes(kit.status) ? "#EF4444" : "#6B7280")
                      : isCurrent
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

          <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
            Current: <strong style={{ color: "#2E1F0C" }}>{formatStatus(kit.status)}</strong>
            {kit.type && <> &bull; {kit.type.charAt(0) + kit.type.slice(1).toLowerCase()} Kit</>}
            {kit.trackingNumber && <> &bull; Tracking: <code style={{ fontSize: "12px" }}>{kit.trackingNumber}</code></>}
          </div>

          {/* Next status button */}
          {nextStatus && (
            <div>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "8px" }}>{nextStatus.description}</div>
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
            </div>
          )}

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
          {kit.status === "PAID" && (
            <div style={{ padding: "12px", background: "#D1FAE5", borderRadius: "8px", fontSize: "14px", color: "#065F46" }}>
              Payment completed.
            </div>
          )}
          {kit.status === "RETURNED" && (
            <div style={{ padding: "12px", background: "#F3F4F6", borderRadius: "8px", fontSize: "14px", color: "#6B7280" }}>
              Items returned to customer.
            </div>
          )}
          {kit.status === "CANCELLED" && (
            <div style={{ padding: "12px", background: "#F3F4F6", borderRadius: "8px", fontSize: "14px", color: "#6B7280" }}>
              This kit has been cancelled.
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

          {isCreatingLabel && (
            <form onSubmit={handleCreateLabel} style={{ marginTop: "12px", marginBottom: "16px" }}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Type</label>
                  <select className="admin-form-input" value={labelType} onChange={(e) => setLabelType(e.target.value)}>
                    <option value="INBOUND">Inbound (Customer → Gold Geek)</option>
                    <option value="RETURN">Return (Gold Geek → Customer)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Carrier</label>
                  <select className="admin-form-input" value={labelCarrier} onChange={(e) => setLabelCarrier(e.target.value)}>
                    <option value="FEDEX">FedEx</option>
                    <option value="USPS">USPS</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Tracking Number *</label>
                <input type="text" className="admin-form-input" value={labelTracking} onChange={(e) => setLabelTracking(e.target.value)} placeholder="e.g., 794644790132" required />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Label URL (optional)</label>
                  <input type="url" className="admin-form-input" value={labelUrl} onChange={(e) => setLabelUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Cost (optional)</label>
                  <input type="number" step="0.01" min="0" className="admin-form-input" value={labelCost} onChange={(e) => setLabelCost(e.target.value)} placeholder="12.50" />
                </div>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Label"}
              </button>
            </form>
          )}

          {kit.shippingLabels && kit.shippingLabels.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              {kit.shippingLabels.map((label) => (
                <div key={label.id} style={{ padding: "12px", background: "#FFFDF7", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#2E1F0C" }}>
                        {label.carrier} &bull; {label.type === "INBOUND" ? "Inbound" : "Return"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6B7280", fontFamily: "monospace", marginTop: "2px" }}>
                        {label.trackingNumber}
                      </div>
                    </div>
                    <span className={`admin-badge ${getStatusBadgeClass(label.status)}`} style={{ fontSize: "11px" }}>
                      {formatStatus(label.status)}
                    </span>
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
                onClick={() => { setIsAddingItem(!isAddingItem); setEditingItemId(null); }}
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
                  <select className="admin-form-input" value={itemType} onChange={(e) => setItemType(e.target.value)} required>
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
                  <select className="admin-form-input" value={metalType} onChange={(e) => setMetalType(e.target.value)} required>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="PALLADIUM">Palladium</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description *</label>
                <input type="text" className="admin-form-input" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="e.g., 14K Gold Ring" required />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Weight (grams)</label>
                  <input type="number" step="0.1" min="0" className="admin-form-input" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} placeholder="5.2" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Purity</label>
                  <select className="admin-form-input" value={itemPurity} onChange={(e) => setItemPurity(e.target.value)}>
                    <option value="10K">10K</option>
                    <option value="14K">14K</option>
                    <option value="18K">18K</option>
                    <option value="22K">22K</option>
                    <option value="24K">24K</option>
                    <option value="sterling">Sterling Silver</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
              </div>

              {autoEstimate && (
                <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "8px" }}>
                  Reference estimate: <strong style={{ color: "#AD7B2A" }}>${autoEstimate}</strong> (based on spot price — enter actual appraised value below)
                </div>
              )}

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Appraised Value ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="admin-form-input"
                    value={appraisedValue}
                    onChange={(e) => setAppraisedValue(e.target.value)}
                    placeholder="Enter actual value"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Condition (optional)</label>
                  <input type="text" className="admin-form-input" value={itemCondition} onChange={(e) => setItemCondition(e.target.value)} placeholder="e.g., Good, Excellent" />
                </div>
              </div>

              <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Item"}
              </button>
            </form>
          )}

          {/* Items List */}
          <div className="admin-items-list">
            {kit.items.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                No items added yet
                {canEditItems && <div style={{ marginTop: "8px", fontSize: "13px" }}>Click &quot;+ Add Item&quot; above to start adding items.</div>}
              </div>
            ) : (
              kit.items.map((item) => (
                <div key={item.id} className="admin-item-card">
                  {editingItemId === item.id ? (
                    /* Inline Edit Form */
                    <form onSubmit={(e) => handleEditItem(e, item.id)} style={{ width: "100%" }}>
                      <div className="admin-form-row">
                        <div className="admin-form-group">
                          <label className="admin-form-label">Type</label>
                          <select className="admin-form-input" value={editType} onChange={(e) => setEditType(e.target.value)}>
                            <option value="JEWELRY">Jewelry</option>
                            <option value="COINS">Coins</option>
                            <option value="BULLION">Bullion</option>
                            <option value="SCRAP">Scrap</option>
                            <option value="WATCHES">Watches</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Metal</label>
                          <select className="admin-form-input" value={editMetalType} onChange={(e) => setEditMetalType(e.target.value)}>
                            <option value="GOLD">Gold</option>
                            <option value="SILVER">Silver</option>
                            <option value="PLATINUM">Platinum</option>
                            <option value="PALLADIUM">Palladium</option>
                          </select>
                        </div>
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Description *</label>
                        <input type="text" className="admin-form-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required />
                      </div>
                      <div className="admin-form-row">
                        <div className="admin-form-group">
                          <label className="admin-form-label">Weight (g)</label>
                          <input type="number" step="0.1" min="0" className="admin-form-input" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Purity</label>
                          <select className="admin-form-input" value={editPurity} onChange={(e) => setEditPurity(e.target.value)}>
                            <option value="10K">10K</option>
                            <option value="14K">14K</option>
                            <option value="18K">18K</option>
                            <option value="22K">22K</option>
                            <option value="24K">24K</option>
                            <option value="sterling">Sterling</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Appraised Value ($) *</label>
                          <input type="number" step="0.01" min="0.01" className="admin-form-input" value={editValue} onChange={(e) => setEditValue(e.target.value)} required />
                        </div>
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Condition</label>
                        <input type="text" className="admin-form-input" value={editCondition} onChange={(e) => setEditCondition(e.target.value)} />
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting} style={{ fontSize: "13px", padding: "6px 12px" }}>
                          {isSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditingItemId(null)} style={{ fontSize: "13px", padding: "6px 12px" }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Item Display */
                    <div className="admin-item-header" style={{ width: "100%" }}>
                      <div>
                        <div className="admin-item-name">{item.description}</div>
                        <div className="admin-item-meta">
                          {item.metalType}
                          {item.weight && ` \u2022 ${parseFloat(item.weight.toString())}g`}
                          {item.purity && ` \u2022 ${item.purity}`}
                          {item.condition && ` \u2022 ${item.condition}`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="admin-item-value">
                          {formatCurrency(parseFloat(item.finalValue?.toString() || item.estimatedValue?.toString() || "0"))}
                        </div>
                        {canEditItems && (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                            <button
                              onClick={() => startEditItem(item)}
                              style={{ color: "#AD7B2A", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              style={{ color: "#DC2626", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}
                              disabled={isSubmitting}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Generate Offer Button */}
          {canGenerateOffer && (
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
        {activeOffer && (
          <div className="admin-section">
            <div className="admin-section-title">Current Offer</div>
            <div className="admin-offer-card">
              <div className="admin-offer-header">
                <div>
                  <Link href={`/admin/offers/${activeOffer.id}`} style={{ textDecoration: "none" }}>
                    <div className="admin-offer-number">{activeOffer.offerNumber}</div>
                  </Link>
                  <div className="admin-offer-status">
                    <span className={`admin-badge ${getStatusBadgeClass(activeOffer.status)}`}>
                      {formatStatus(activeOffer.status)}
                    </span>
                  </div>
                </div>
                <div className="admin-offer-amount">
                  {formatCurrency(parseFloat(activeOffer.totalValue.toString()))}
                </div>
              </div>
              {activeOffer.status === "DRAFT" && (
                <button
                  onClick={() => handleSendOffer(activeOffer.id)}
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

        {/* Declined/expired offers — allow generating a new one */}
        {kit.status === "EVALUATING" && !activeOffer && kit.offers.length > 0 && (
          <div className="admin-section">
            <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "8px" }}>
              Previous offers were declined or expired. You can generate a new offer.
            </div>
            {kit.items.length > 0 ? (
              <button
                onClick={handleGenerateOffer}
                className="admin-btn admin-btn-primary"
                style={{ width: "100%" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Generating..." : "Generate New Offer"}
              </button>
            ) : (
              <div style={{ fontSize: "13px", color: "#6B7280" }}>Add items before generating an offer.</div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* NOTES                                                        */}
        {/* ============================================================ */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Internal Notes</h2>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: "13px", padding: "6px 12px" }}
              >
                {kit.notes ? "Edit" : "Add Notes"}
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div style={{ marginTop: "12px" }}>
              <textarea
                className="admin-form-input"
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={4}
                placeholder="Internal notes visible only to admin staff..."
                style={{ width: "100%", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button onClick={handleSaveNotes} className="admin-btn admin-btn-primary" disabled={isSubmitting} style={{ fontSize: "13px", padding: "6px 12px" }}>
                  {isSubmitting ? "Saving..." : "Save Notes"}
                </button>
                <button onClick={() => { setIsEditingNotes(false); setNotesValue(kit.notes || ""); }} className="admin-btn admin-btn-secondary" style={{ fontSize: "13px", padding: "6px 12px" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "8px", fontSize: "14px", color: kit.notes ? "#2E1F0C" : "#9CA3AF", whiteSpace: "pre-wrap" }}>
              {kit.notes || "No notes added yet."}
            </div>
          )}
        </div>

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
                    {event.description && <div className="admin-timeline-desc">{event.description}</div>}
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
