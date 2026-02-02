"use client";

import { useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { formatCurrency } from "@/lib/db/utils";
import { addItemToKit, updateItem, deleteItem } from "@/lib/actions/admin/item.actions";
import { generateOffer, sendOffer } from "@/lib/actions/admin/offer.actions";
import { updateKitStatus } from "@/lib/actions/admin/kit.actions";

interface Kit {
  id: string;
  kitNumber: string;
  type: string;
  status: string;
  createdAt: Date | string;
  customer: {
    firstName: string;
    lastName: string;
    phone?: string;
    user: {
      email: string;
    };
    addresses: any[];
  };
  items: any[];
  offers: any[];
  timeline: any[];
  shippingAddress: any;
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

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RequestDetailClient({ kit: initialKit }: { kit: Kit }) {
  const [kit, setKit] = useState(initialKit);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemType, setItemType] = useState("JEWELRY");
  const [itemDescription, setItemDescription] = useState("");
  const [metalType, setMetalType] = useState("GOLD");
  const [itemWeight, setItemWeight] = useState("");
  const [itemPurity, setItemPurity] = useState("14K");
  const [itemCondition, setItemCondition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const estimatedValue = itemWeight && itemPurity
    ? (parseFloat(itemWeight) * (pricePerGram[itemPurity] || 0)).toFixed(2)
    : "0.00";

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addItemToKit(kit.id, {
        type: itemType as any,
        description: itemDescription,
        metalType: metalType as any,
        weight: parseFloat(itemWeight),
        purity: itemPurity,
        quantity: 1,
        condition: itemCondition,
        finalValue: parseFloat(estimatedValue),
      });

      if (result.success) {
        // Refresh the page to show new item
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

  const shippingAddress = kit.shippingAddress || kit.customer.addresses[0];
  const latestOffer = kit.offers && kit.offers.length > 0 ? kit.offers[0] : null;

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
            <span className="admin-badge in-progress" style={{ marginTop: "4px" }}>
              {formatStatus(kit.status)}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="admin-section">
          <div className="admin-section-title">Customer Information</div>
          <div className="admin-info-grid">
            <div>
              <div className="admin-info-label">Name</div>
              <div className="admin-info-value">{kit.customer.firstName} {kit.customer.lastName}</div>
            </div>
            <div>
              <div className="admin-info-label">Email</div>
              <div className="admin-info-value">{kit.customer.user.email}</div>
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

        {/* Items Section */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Items ({kit.items.length})</h2>
            {kit.status === "EVALUATING" && (
              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="admin-btn-secondary"
                style={{ fontSize: "14px", padding: "6px 12px" }}
              >
                {isAddingItem ? "Cancel" : "+ Add Item"}
              </button>
            )}
          </div>

          {/* Add Item Form */}
          {isAddingItem && (
            <form onSubmit={handleAddItem} className="admin-form" style={{ marginBottom: "20px" }}>
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
                className="admin-btn-primary"
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
              </div>
            ) : (
              kit.items.map((item) => (
                <div key={item.id} className="admin-item-card">
                  <div className="admin-item-header">
                    <div>
                      <div className="admin-item-name">{item.description}</div>
                      <div className="admin-item-meta">
                        {item.metalType} • {item.weight}g • {item.purity}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="admin-item-value">
                        {formatCurrency(parseFloat(item.finalValue?.toString() || item.estimatedValue?.toString() || "0"))}
                      </div>
                      {kit.status === "EVALUATING" && (
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
              className="admin-btn-primary"
              style={{ marginTop: "16px" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating..." : "Generate Offer"}
            </button>
          )}
        </div>

        {/* Offer Section */}
        {latestOffer && (
          <div className="admin-section">
            <div className="admin-section-title">Current Offer</div>
            <div className="admin-offer-card">
              <div className="admin-offer-header">
                <div>
                  <div className="admin-offer-number">{latestOffer.offerNumber}</div>
                  <div className="admin-offer-status">{formatStatus(latestOffer.status)}</div>
                </div>
                <div className="admin-offer-amount">
                  {formatCurrency(parseFloat(latestOffer.totalValue.toString()))}
                </div>
              </div>
              {latestOffer.status === "DRAFT" && (
                <button
                  onClick={() => handleSendOffer(latestOffer.id)}
                  className="admin-btn-primary"
                  style={{ marginTop: "12px" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Offer to Customer"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="admin-section">
          <div className="admin-section-title">Timeline</div>
          <div className="admin-timeline">
            {kit.timeline.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                No timeline events
              </div>
            ) : (
              kit.timeline.map((event: any) => (
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
    </div>
  );
}
