"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { formatCurrency } from "@/lib/db/utils";
import { formatDate, formatStatus, formatDescription, getStatusBadgeClass } from "@/lib/admin-utils";
import { addItemToKit, updateItem, deleteItem } from "@/lib/actions/admin/item.actions";
import { generateOffer, sendOffer } from "@/lib/actions/admin/offer.actions";
import { updateKitStatus, updateKitNotes, updateKitType } from "@/lib/actions/admin/kit.actions";
import { createShippingLabel, generatePhysicalKitFedExLabels, generateReturnFedExLabel, validateAddressWithFedEx, updateReturnStatus } from "@/lib/actions/admin/shipping.actions";
import { processPayment, updatePaymentStatus } from "@/lib/actions/admin/payment.actions";
import type { KitStatus, ItemType, MetalType, ShippingLabelType, ShippingCarrier, PaymentMethod, PaymentStatus, ReturnStatus } from "@prisma/client";

interface Kit {
  id: string;
  kitNumber: string;
  type: string;
  status: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: Date | string;
  kitSentAt: string | null;
  receivedAt: string | null;
  evaluationStartAt: string | null;
  completedAt: string | null;
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
    expiresAt: string | null;
    sentAt: string | null;
    respondedAt: string | null;
    createdAt: string;
    itemBreakdown: Array<{ itemId: string; description: string; value: string }> | null;
    payment: {
      id: string;
      paymentNumber: string;
      amount: { toString(): string };
      method: string;
      status: string;
      trackingNumber: string | null;
      checkNumber: string | null;
    } | null;
  }>;
  shippingLabels: Array<{
    id: string;
    type: string;
    carrier: string;
    trackingNumber: string;
    status: string;
    labelUrl: string | null;
    labelData: string | null;
    createdAt: Date | string;
  }>;
  returns: Array<{
    id: string;
    returnNumber: string;
    status: string;
    reason: string | null;
    trackingNumber: string | null;
    createdAt: string;
    shippedAt: string | null;
    deliveredAt: string | null;
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
  PENDING: { next: "SHIPPED", label: "Mark Shipped", description: "Kit/label has been mailed to customer" },
  SHIPPED: null, // Waiting for package arrival (auto-advances to EVALUATING on delivery)
  EVALUATING: null,
  OFFER_SENT: null,
  ACCEPTED: null,
  DECLINED: null,
  PAID: null,
  RETURNED: null,
  CANCELLED: null,
};

// Full ordered workflow for the progress bar
const WORKFLOW_STEPS = ["PENDING", "SHIPPED", "EVALUATING", "OFFER_SENT"];
const TERMINAL_STATUSES = ["ACCEPTED", "PAID", "DECLINED", "RETURNED", "CANCELLED"];

const ITEM_EDITABLE_STATUSES = ["EVALUATING"];

// Payment status flow
const PAYMENT_NEXT_STATUS: Record<string, { next: string; label: string }> = {
  PENDING: { next: "PROCESSING", label: "Mark Processing" },
  PROCESSING: { next: "SENT", label: "Mark Sent" },
  SENT: { next: "COMPLETED", label: "Mark Completed" },
};

// Return status flow
const RETURN_NEXT_STATUS: Record<string, { next: string; label: string }> = {
  PENDING: { next: "LABEL_CREATED", label: "Mark Label Created" },
  LABEL_CREATED: { next: "IN_TRANSIT", label: "Mark In Transit" },
  IN_TRANSIT: { next: "DELIVERED", label: "Mark Delivered" },
};

// Offer expiration helper
function getExpirationDisplay(expiresAt: string | null): { text: string; isExpired: boolean; urgency: "normal" | "warning" | "expired" } {
  if (!expiresAt) return { text: "", isExpired: false, urgency: "normal" };
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) {
    const agoDays = Math.floor(Math.abs(diffMs) / 86400000);
    return { text: `Expired ${agoDays > 0 ? `${agoDays}d ago` : "today"}`, isExpired: true, urgency: "expired" };
  }

  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);

  if (days <= 1) return { text: `Expires in ${hours}h`, isExpired: false, urgency: "warning" };
  return { text: `Expires in ${days}d ${hours}h`, isExpired: false, urgency: "normal" };
}

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

const VALID_BACK_PAGES: Record<string, string> = {
  offers: "/admin/offers",
  payments: "/admin/payments",
  returns: "/admin/returns",
  shipping: "/admin/shipping",
};

export default function RequestDetailClient({ kit }: { kit: Kit }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const backHref = (fromParam && VALID_BACK_PAGES[fromParam]) || "/admin/requests";

  // UI state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [showOfferHistory, setShowOfferHistory] = useState(false);

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    variant: "danger" | "warning" | "default";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

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

  // FedEx auto-generate state
  const [isGeneratingFedEx, setIsGeneratingFedEx] = useState(false);
  const [addressValidation, setAddressValidation] = useState<"valid" | "invalid" | null>(null);

  // Notes state
  const [notesValue, setNotesValue] = useState(kit.notes || "");

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<string>("CHECK");

  // Sync notes when kit prop changes (after router.refresh)
  useEffect(() => {
    setNotesValue(kit.notes || "");
  }, [kit.notes]);

  // Auto-estimate for the add form (reference only)
  const autoEstimate = itemWeight && itemPurity
    ? (parseFloat(itemWeight) * (estimatePricePerGram[itemPurity] || 0)).toFixed(2)
    : "";

  const canEditItems = ITEM_EDITABLE_STATUSES.includes(kit.status);
  const nextStatus = STATUS_FLOW[kit.status];
  const shippingAddress = kit.shippingAddress || kit.customer.addresses[0];
  const isTerminal = TERMINAL_STATUSES.includes(kit.status);

  // Current offer = latest DRAFT, SENT, or ACCEPTED offer
  const currentOffer = kit.offers?.find((o) => ["DRAFT", "SENT", "ACCEPTED"].includes(o.status)) || null;
  // Past offers = everything else (declined, expired)
  const pastOffers = kit.offers?.filter((o) => o.id !== currentOffer?.id) || [];

  // Can generate a new offer when evaluating and no active draft/sent offer exists
  const canGenerateOffer = kit.items.length > 0 && kit.status === "EVALUATING" && !currentOffer;

  // Items total
  const itemsTotal = kit.items.reduce((sum, item) => {
    const val = item.finalValue ? parseFloat(item.finalValue.toString()) : item.estimatedValue ? parseFloat(item.estimatedValue.toString()) : 0;
    return sum + val;
  }, 0);

  // Shipping label checks
  const hasKitDeliveryLabel = kit.shippingLabels.some((l) => l.type === "KIT_DELIVERY");
  const hasInboundLabel = kit.shippingLabels.some((l) => l.type === "INBOUND");
  const hasReturnLabel = kit.shippingLabels.some((l) => l.type === "RETURN");

  // Kit type toggle guards
  const canChangeType = kit.status === "PENDING";
  const hasLabels = kit.shippingLabels.length > 0;

  // Return record
  const activeReturn = kit.returns?.[0] || null;

  // Payment from accepted offer
  const acceptedOffer = kit.offers?.find((o) => o.status === "ACCEPTED") || null;
  const existingPayment = acceptedOffer?.payment || currentOffer?.payment || null;

  const showFeedback = (type: "error" | "success", message: string) => {
    setFeedback({ type, message });
    if (type === "success") setTimeout(() => setFeedback(null), 3000);
  };

  // ─── Status Change ────────────────────────────────────────────────────────
  const executeStatusChange = async () => {
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

  const handleStatusChange = () => {
    if (!nextStatus) return;
    setConfirmAction({
      title: nextStatus.label,
      message: `Change kit status from "${formatStatus(kit.status)}" to "${formatStatus(nextStatus.next)}". ${nextStatus.description}.`,
      variant: "warning",
      confirmLabel: nextStatus.label,
      onConfirm: executeStatusChange,
    });
  };

  // ─── Cancel Kit ───────────────────────────────────────────────────────────
  const handleCancelKit = () => {
    setConfirmAction({
      title: "Cancel Kit",
      message: `This will cancel kit ${kit.kitNumber}. The customer will not be automatically notified. This action is difficult to reverse.`,
      variant: "danger",
      confirmLabel: "Cancel Kit",
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const result = await updateKitStatus(kit.id, "CANCELLED" as KitStatus);
          if (result.success) {
            showFeedback("success", "Kit cancelled");
            router.refresh();
          } else {
            showFeedback("error", result.error || "Failed to cancel kit");
          }
        } catch {
          showFeedback("error", "Failed to cancel kit");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ─── Items ────────────────────────────────────────────────────────────────
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

  const handleDeleteItem = (itemId: string, description: string) => {
    setConfirmAction({
      title: "Delete Item",
      message: `Permanently remove "${description}" from this kit? This cannot be undone.`,
      variant: "danger",
      confirmLabel: "Delete Item",
      onConfirm: async () => {
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
      },
    });
  };

  // ─── Offer ────────────────────────────────────────────────────────────────
  const handleGenerateOffer = () => {
    const total = formatCurrency(itemsTotal);
    setConfirmAction({
      title: "Generate Offer",
      message: `Create an offer based on ${kit.items.length} item(s) totaling ${total}. The offer will be a draft until you send it.`,
      variant: "warning",
      confirmLabel: "Generate Offer",
      onConfirm: async () => {
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
      },
    });
  };

  const handleSendOffer = (offerId: string, amount: string) => {
    setConfirmAction({
      title: "Send Offer to Customer",
      message: `This will email the customer an offer of ${amount} with a 7-day expiration. The kit status will change to "Offer Sent".`,
      variant: "warning",
      confirmLabel: "Send Offer",
      onConfirm: async () => {
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
      },
    });
  };

  // ─── Shipping Labels ──────────────────────────────────────────────────────
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

  const handleGeneratePhysicalKitLabels = async () => {
    setIsGeneratingFedEx(true);
    setFeedback(null);
    try {
      const result = await generatePhysicalKitFedExLabels(kit.id);
      if (result.success) {
        showFeedback("success", "FedEx labels generated — Kit Delivery + Inbound prepaid label ready.");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to generate FedEx labels");
      }
    } catch {
      showFeedback("error", "Failed to generate FedEx labels");
    } finally {
      setIsGeneratingFedEx(false);
    }
  };

  const handleGenerateReturnLabel = async () => {
    setIsGeneratingFedEx(true);
    setFeedback(null);
    try {
      const result = await generateReturnFedExLabel(kit.id);
      if (result.success) {
        showFeedback("success", "FedEx return label generated.");
        router.refresh();
      } else {
        showFeedback("error", result.error || "Failed to generate return label");
      }
    } catch {
      showFeedback("error", "Failed to generate return label");
    } finally {
      setIsGeneratingFedEx(false);
    }
  };

  const handleValidateAddress = async () => {
    const addr = shippingAddress;
    if (!addr) return;
    setFeedback(null);
    try {
      const result = await validateAddressWithFedEx({
        street1: addr.street1,
        street2: addr.street2 ?? undefined,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
      });
      if (result.success && result.data?.valid) {
        setAddressValidation("valid");
        showFeedback("success", "Address validated by FedEx.");
      } else {
        setAddressValidation("invalid");
        showFeedback("error", result.data?.message ?? result.error ?? "Address validation failed.");
      }
    } catch {
      setAddressValidation("invalid");
      showFeedback("error", "Address validation failed.");
    }
  };

  // ─── Notes ────────────────────────────────────────────────────────────────
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

  // ─── Payment ──────────────────────────────────────────────────────────────
  const handleProcessPayment = () => {
    const offer = acceptedOffer || currentOffer;
    if (!offer) return;
    const amount = formatCurrency(parseFloat(offer.totalValue.toString()));
    const methodLabel = formatStatus(paymentMethod);
    setConfirmAction({
      title: "Process Payment",
      message: `Initiate a payment of ${amount} via ${methodLabel} to ${kit.customer.firstName} ${kit.customer.lastName}.`,
      variant: "warning",
      confirmLabel: "Process Payment",
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const result = await processPayment({
            offerId: offer.id,
            customerId: kit.customer.id,
            amount: parseFloat(offer.totalValue.toString()),
            method: paymentMethod as PaymentMethod,
          });
          if (result.success) {
            showFeedback("success", "Payment created successfully!");
            router.refresh();
          } else {
            showFeedback("error", result.error || "Failed to process payment");
          }
        } catch {
          showFeedback("error", "Failed to process payment");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleAdvancePayment = (paymentId: string, nextPaymentStatus: string, label: string) => {
    setConfirmAction({
      title: label,
      message: `Advance payment status to "${formatStatus(nextPaymentStatus)}".${nextPaymentStatus === "SENT" ? " This will notify the customer and mark the kit as Paid." : ""}`,
      variant: "warning",
      confirmLabel: label,
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const result = await updatePaymentStatus(paymentId, nextPaymentStatus as PaymentStatus);
          if (result.success) {
            showFeedback("success", `Payment status updated to ${formatStatus(nextPaymentStatus)}`);
            router.refresh();
          } else {
            showFeedback("error", result.error || "Failed to update payment status");
          }
        } catch {
          showFeedback("error", "Failed to update payment status");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ─── Return ───────────────────────────────────────────────────────────────
  const handleAdvanceReturn = (returnId: string, nextReturnStatus: string, label: string) => {
    setConfirmAction({
      title: label,
      message: `Advance return status to "${formatStatus(nextReturnStatus)}".${nextReturnStatus === "DELIVERED" ? " This will mark the kit as Returned." : ""}`,
      variant: "warning",
      confirmLabel: label,
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const result = await updateReturnStatus(returnId, nextReturnStatus as ReturnStatus);
          if (result.success) {
            showFeedback("success", `Return status updated to ${formatStatus(nextReturnStatus)}`);
            router.refresh();
          } else {
            showFeedback("error", result.error || "Failed to update return status");
          }
        } catch {
          showFeedback("error", "Failed to update return status");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ─── Kit Type ─────────────────────────────────────────────────────────────
  const handleTypeChange = (newType: string) => {
    if (newType === kit.type) return;
    const doChange = async () => {
      setIsSubmitting(true);
      try {
        const result = await updateKitType(kit.id, newType as "PHYSICAL" | "DIGITAL");
        if (result.success) {
          showFeedback("success", `Kit type changed to ${newType.toLowerCase()}`);
          router.refresh();
        } else {
          showFeedback("error", result.error || "Failed to update kit type");
        }
      } catch {
        showFeedback("error", "Failed to update kit type");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (hasLabels) {
      setConfirmAction({
        title: "Change Kit Type",
        message: "Shipping labels already exist for this kit. Changing the type may cause label mismatch. Are you sure?",
        variant: "warning",
        confirmLabel: "Change Type",
        onConfirm: doChange,
      });
    } else {
      doChange();
    }
  };

  // Determine progress bar state
  const currentStepIdx = WORKFLOW_STEPS.indexOf(kit.status);

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main" style={{ paddingBottom: "100px" }}>
        {/* Header */}
        <div className="admin-detail-header">
          <Link href={backHref} className="admin-back-btn">
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
            {kit.trackingNumber && <> &bull; Tracking: <code style={{ fontSize: "12px" }}>{kit.trackingNumber}</code></>}
          </div>

          {/* Lifecycle timestamps */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px", color: "#9CA3AF", marginBottom: "12px" }}>
            <span>Created {formatDate(kit.createdAt)}</span>
            {kit.kitSentAt && <span>&bull; Sent {formatDate(kit.kitSentAt)}</span>}
            {kit.receivedAt && <span>&bull; Received {formatDate(kit.receivedAt)}</span>}
            {kit.evaluationStartAt && <span>&bull; Evaluation {formatDate(kit.evaluationStartAt)}</span>}
            {kit.completedAt && <span>&bull; Completed {formatDate(kit.completedAt)}</span>}
          </div>

          {/* Kit Type Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "10px 12px", background: "#F9FAFB", borderRadius: "8px" }}>
            <span style={{ fontSize: "13px", color: "#6B7280", minWidth: "60px" }}>Kit Type:</span>
            {canChangeType ? (
              <div style={{ display: "flex", gap: "4px" }}>
                {(["PHYSICAL", "DIGITAL"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    disabled={isSubmitting}
                    style={{
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: t === kit.type ? 600 : 400,
                      border: t === kit.type ? "1px solid #AD7B2A" : "1px solid #E5E7EB",
                      borderRadius: "6px",
                      background: t === kit.type ? "#AD7B2A" : "#FFFFFF",
                      color: t === kit.type ? "#FFFFFF" : "#6B7280",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#2E1F0C" }}>
                {kit.type.charAt(0) + kit.type.slice(1).toLowerCase()}
              </span>
            )}
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

          {/* Status-specific info banners */}
          {kit.status === "EVALUATING" && !currentOffer && kit.items.length === 0 && (
            <div style={{ padding: "12px", background: "#FEF3C7", borderRadius: "8px", fontSize: "14px", color: "#92400E" }}>
              Add items and generate an offer to proceed.
            </div>
          )}
          {kit.status === "OFFER_SENT" && (() => {
            const sentOffer = kit.offers?.find((o) => o.status === "SENT");
            const expiry = sentOffer ? getExpirationDisplay(sentOffer.expiresAt) : null;
            return (
              <div style={{ padding: "12px", background: "#FEF3C7", borderRadius: "8px", fontSize: "14px", color: "#92400E" }}>
                Waiting for customer to respond to the offer.
                {expiry?.text && (
                  <span style={{ marginLeft: "8px", fontWeight: 600, color: expiry.urgency === "expired" ? "#DC2626" : expiry.urgency === "warning" ? "#D97706" : "#92400E" }}>
                    {expiry.text}
                  </span>
                )}
              </div>
            );
          })()}
          {kit.status === "ACCEPTED" && (
            <div style={{ padding: "12px", background: "#D1FAE5", borderRadius: "8px", fontSize: "14px", color: "#065F46" }}>
              Customer accepted the offer. Process payment below.
            </div>
          )}
          {kit.status === "DECLINED" && (
            <div style={{ padding: "12px", background: "#FEE2E2", borderRadius: "8px", fontSize: "14px", color: "#991B1B" }}>
              Customer declined. Manage the return below.
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

          {/* Cancel Kit button — available for all non-terminal statuses */}
          {!isTerminal && (
            <button
              onClick={handleCancelKit}
              disabled={isSubmitting}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 500,
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                background: "#FFFFFF",
                color: "#DC2626",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel Kit
            </button>
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
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {/* FedEx auto-generate buttons — only when customer has an address */}
              {shippingAddress && (
                <>
                  {kit.type === "PHYSICAL" && !hasKitDeliveryLabel && !hasInboundLabel && (
                    <button
                      onClick={handleGeneratePhysicalKitLabels}
                      className="admin-btn admin-btn-primary"
                      style={{ fontSize: "13px", padding: "6px 12px" }}
                      disabled={isGeneratingFedEx}
                      title="Generate Kit Delivery + Inbound prepaid labels via FedEx API"
                    >
                      {isGeneratingFedEx ? "Generating..." : "Generate FedEx Labels"}
                    </button>
                  )}
                  {kit.status === "DECLINED" && !hasReturnLabel && (
                    <button
                      onClick={handleGenerateReturnLabel}
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: "13px", padding: "6px 12px" }}
                      disabled={isGeneratingFedEx}
                      title="Generate a return label (Gold Geek -> Customer) via FedEx API"
                    >
                      {isGeneratingFedEx ? "Generating..." : "Generate Return Label"}
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: "13px", padding: "6px 12px" }}
              >
                {isCreatingLabel ? "Cancel" : "+ Manual Label"}
              </button>
            </div>
          </div>

          {isCreatingLabel && (
            <form onSubmit={handleCreateLabel} style={{ marginTop: "12px", marginBottom: "16px" }}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Type</label>
                  <select className="admin-form-input" value={labelType} onChange={(e) => setLabelType(e.target.value)}>
                    <option value="INBOUND">Inbound (Customer → Gold Geek)</option>
                    <option value="RETURN">Return (Gold Geek → Customer)</option>
                    <option value="KIT_DELIVERY">Kit Delivery (Gold Geek → Customer)</option>
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
              {kit.shippingLabels.map((label) => {
                const labelTypeLabel =
                  label.type === "INBOUND" ? "Inbound"
                  : label.type === "RETURN" ? "Return"
                  : "Kit Delivery";
                const pdfDataUrl = label.labelData
                  ? `data:application/pdf;base64,${label.labelData}`
                  : null;
                return (
                  <div key={label.id} style={{ padding: "12px", background: "#FFFDF7", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#2E1F0C" }}>
                          {label.carrier} &bull; {labelTypeLabel}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B7280", fontFamily: "monospace", marginTop: "2px" }}>
                          {label.trackingNumber}
                        </div>
                      </div>
                      <span className={`admin-badge ${getStatusBadgeClass(label.status)}`} style={{ fontSize: "11px" }}>
                        {formatStatus(label.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <span>Created {formatDate(label.createdAt)}</span>
                      {label.labelUrl && (
                        <a href={label.labelUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#AD7B2A" }}>View Label</a>
                      )}
                      {pdfDataUrl && (
                        <a href={pdfDataUrl} download={`label-${label.trackingNumber}.pdf`} style={{ color: "#AD7B2A" }}>
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
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
                    <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={handleValidateAddress}
                        style={{ fontSize: "11px", padding: "3px 8px", background: "none", border: "1px solid #D1D5DB", borderRadius: "4px", cursor: "pointer", color: "#6B7280" }}
                      >
                        Validate with FedEx
                      </button>
                      {addressValidation === "valid" && (
                        <span style={{ fontSize: "11px", color: "#065F46" }}>&#10003; Valid</span>
                      )}
                      {addressValidation === "invalid" && (
                        <span style={{ fontSize: "11px", color: "#991B1B" }}>&#10005; Invalid</span>
                      )}
                    </div>
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
                              onClick={() => handleDeleteItem(item.id, item.description)}
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

          {/* Items total */}
          {kit.items.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", marginTop: "8px", background: "#F9FAFB", borderRadius: "8px", borderTop: "2px solid #E5E7EB" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>Total Appraised Value</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#AD7B2A" }}>{formatCurrency(itemsTotal)}</span>
            </div>
          )}

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
        {(currentOffer || pastOffers.length > 0) && (
          <div className="admin-section">
            <div className="admin-section-title">
              {currentOffer ? "Current Offer" : "Offers"}
            </div>

            {/* Current offer card */}
            {currentOffer && (
              <div className="admin-offer-card">
                <div className="admin-offer-header">
                  <div>
                    <div className="admin-offer-number">{currentOffer.offerNumber}</div>
                    <div className="admin-offer-status" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span className={`admin-badge ${getStatusBadgeClass(currentOffer.status)}`}>
                        {formatStatus(currentOffer.status)}
                      </span>
                      {/* Expiration display for SENT offers */}
                      {currentOffer.status === "SENT" && (() => {
                        const expiry = getExpirationDisplay(currentOffer.expiresAt);
                        return expiry.text ? (
                          <span style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: expiry.urgency === "expired" ? "#DC2626" : expiry.urgency === "warning" ? "#D97706" : "#065F46",
                          }}>
                            {expiry.text}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="admin-offer-amount">
                    {formatCurrency(parseFloat(currentOffer.totalValue.toString()))}
                  </div>
                </div>

                {/* Item breakdown */}
                {currentOffer.itemBreakdown && currentOffer.itemBreakdown.length > 0 && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #E5E7EB", paddingTop: "10px" }}>
                    {currentOffer.itemBreakdown.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6B7280", padding: "2px 0" }}>
                        <span>{item.description}</span>
                        <span>{formatCurrency(parseFloat(item.value))}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentOffer.status === "DRAFT" && (
                  <button
                    onClick={() => handleSendOffer(currentOffer.id, formatCurrency(parseFloat(currentOffer.totalValue.toString())))}
                    className="admin-btn admin-btn-primary"
                    style={{ marginTop: "12px", width: "100%" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Offer to Customer"}
                  </button>
                )}
              </div>
            )}

            {/* Declined/expired offers — allow generating a new one */}
            {kit.status === "EVALUATING" && !currentOffer && kit.offers.length > 0 && (
              <div style={{ marginTop: "8px" }}>
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

            {/* Offer history (collapsible) */}
            {pastOffers.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={() => setShowOfferHistory(!showOfferHistory)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#6B7280", padding: "4px 0", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showOfferHistory ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Past Offers ({pastOffers.length})
                </button>
                {showOfferHistory && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                    {pastOffers.map((offer) => (
                      <div key={offer.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F9FAFB", borderRadius: "6px", fontSize: "13px" }}>
                        <div>
                          <span style={{ color: "#AD7B2A", fontWeight: 500 }}>
                            {offer.offerNumber}
                          </span>
                          <span className={`admin-badge ${getStatusBadgeClass(offer.status)}`} style={{ marginLeft: "8px", fontSize: "11px" }}>
                            {formatStatus(offer.status)}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 600, color: "#2E1F0C" }}>{formatCurrency(parseFloat(offer.totalValue.toString()))}</div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{formatDate(offer.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PAYMENT (inline)                                             */}
        {/* ============================================================ */}
        {(kit.status === "ACCEPTED" || kit.status === "PAID") && (
          <div className="admin-section">
            <div className="admin-section-title">Payment</div>

            {existingPayment ? (
              /* Payment exists — show status card */
              <div style={{ padding: "16px", background: "#FFFDF7", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>{existingPayment.paymentNumber}</div>
                    <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                      {formatStatus(existingPayment.method)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#AD7B2A" }}>
                      {formatCurrency(parseFloat(existingPayment.amount.toString()))}
                    </div>
                    <span className={`admin-badge ${getStatusBadgeClass(existingPayment.status)}`} style={{ fontSize: "11px", marginTop: "4px" }}>
                      {formatStatus(existingPayment.status)}
                    </span>
                  </div>
                </div>

                {existingPayment.trackingNumber && (
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>
                    Tracking: <code style={{ fontSize: "12px" }}>{existingPayment.trackingNumber}</code>
                  </div>
                )}
                {existingPayment.checkNumber && (
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>
                    Check #: <code style={{ fontSize: "12px" }}>{existingPayment.checkNumber}</code>
                  </div>
                )}

                {/* Advance payment status */}
                {PAYMENT_NEXT_STATUS[existingPayment.status] && (
                  <button
                    onClick={() => handleAdvancePayment(
                      existingPayment.id,
                      PAYMENT_NEXT_STATUS[existingPayment.status].next,
                      PAYMENT_NEXT_STATUS[existingPayment.status].label
                    )}
                    className="admin-btn admin-btn-primary"
                    style={{ marginTop: "12px", width: "100%", fontSize: "13px" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : PAYMENT_NEXT_STATUS[existingPayment.status].label}
                  </button>
                )}
              </div>
            ) : (
              /* No payment yet — show payment form */
              <div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
                  Select a payment method and process payment for {acceptedOffer ? formatCurrency(parseFloat(acceptedOffer.totalValue.toString())) : "the accepted offer"}.
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Payment Method</label>
                  <select className="admin-form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="CHECK">Check</option>
                    <option value="ACH">ACH / Bank Transfer</option>
                    <option value="ZELLE">Zelle</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="VENMO">Venmo</option>
                  </select>
                </div>
                <button
                  onClick={handleProcessPayment}
                  className="admin-btn admin-btn-primary"
                  style={{ width: "100%", marginTop: "8px" }}
                  disabled={isSubmitting || !acceptedOffer}
                >
                  {isSubmitting ? "Processing..." : "Process Payment"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* RETURN (inline)                                              */}
        {/* ============================================================ */}
        {(kit.status === "DECLINED" || kit.status === "RETURNED") && (
          <div className="admin-section">
            <div className="admin-section-title">Return</div>

            {activeReturn ? (
              <div style={{ padding: "16px", background: "#FFFDF7", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#2E1F0C" }}>{activeReturn.returnNumber}</div>
                    {activeReturn.reason && (
                      <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>{activeReturn.reason}</div>
                    )}
                  </div>
                  <span className={`admin-badge ${getStatusBadgeClass(activeReturn.status)}`} style={{ fontSize: "11px" }}>
                    {formatStatus(activeReturn.status)}
                  </span>
                </div>

                {activeReturn.trackingNumber && (
                  <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}>
                    Tracking: <code style={{ fontSize: "12px" }}>{activeReturn.trackingNumber}</code>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "#9CA3AF", marginBottom: "12px" }}>
                  <span>Created {formatDate(activeReturn.createdAt)}</span>
                  {activeReturn.shippedAt && <span>&bull; Shipped {formatDate(activeReturn.shippedAt)}</span>}
                  {activeReturn.deliveredAt && <span>&bull; Delivered {formatDate(activeReturn.deliveredAt)}</span>}
                </div>

                {/* Generate return label if needed */}
                {shippingAddress && !hasReturnLabel && activeReturn.status === "PENDING" && (
                  <button
                    onClick={handleGenerateReturnLabel}
                    className="admin-btn admin-btn-secondary"
                    style={{ width: "100%", fontSize: "13px", marginBottom: "8px" }}
                    disabled={isGeneratingFedEx}
                  >
                    {isGeneratingFedEx ? "Generating..." : "Generate Return FedEx Label"}
                  </button>
                )}

                {/* Advance return status */}
                {RETURN_NEXT_STATUS[activeReturn.status] && (
                  <button
                    onClick={() => handleAdvanceReturn(
                      activeReturn.id,
                      RETURN_NEXT_STATUS[activeReturn.status].next,
                      RETURN_NEXT_STATUS[activeReturn.status].label
                    )}
                    className="admin-btn admin-btn-primary"
                    style={{ width: "100%", fontSize: "13px" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : RETURN_NEXT_STATUS[activeReturn.status].label}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ padding: "16px", textAlign: "center", color: "#6B7280", fontSize: "14px" }}>
                No return record found. The return is typically created automatically when the customer declines an offer.
              </div>
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
                    {event.description && <div className="admin-timeline-desc">{formatDescription(event.description)}</div>}
                    <div className="admin-timeline-date">{formatDate(event.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <AdminBottomNav />

      {/* Global Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        variant={confirmAction?.variant || "default"}
        confirmLabel={confirmAction?.confirmLabel || "Confirm"}
        onConfirm={() => {
          confirmAction?.onConfirm();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
