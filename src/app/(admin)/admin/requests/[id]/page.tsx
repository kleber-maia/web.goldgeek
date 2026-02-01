"use client";

import { use, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Mock data for request detail
const mockRequest = {
  id: "r098",
  displayId: "#098",
  status: "evaluating",
  customer: {
    name: "Mary Johnson",
    email: "mary.j@email.com",
    phone: "(555) 456-7890",
    address: "321 Elm Street\nHouston, TX 77001",
  },
  timeline: [
    { event: "Evaluation started", date: "Jan 10, 2025" },
    { event: "Package received", date: "Jan 10, 2025" },
    { event: "Package shipped by customer", date: "Jan 8, 2025" },
    { event: "Digital kit sent", date: "Jan 7, 2025" },
    { event: "Kit requested", date: "Jan 7, 2025" },
  ],
  items: [
    { id: 1, name: "14K Gold Ring", weight: "5.2g", description: "Wedding band", value: "$192.40" },
    { id: 2, name: "18K Gold Necklace", weight: "12.1g", description: "Chain necklace", value: "$574.75" },
  ],
  totalValue: "$767.15",
};

const pricePerGram: Record<string, number> = {
  "10K": 26.50,
  "14K": 37.00,
  "18K": 47.50,
  "22K": 58.00,
  "24K": 63.00,
  "sterling": 0.85,
  "platinum": 32.00,
};

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In production, id would be used to fetch the request from the API
  const _params = use(params);
  void _params.id;
  const [itemType, setItemType] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemPurity, setItemPurity] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const estimatedValue = itemWeight && itemPurity
    ? (parseFloat(itemWeight) * (pricePerGram[itemPurity] || 0)).toFixed(2)
    : "0.00";

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Item added! (Demo - in production this would save to database)");
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
            <h1 className="admin-detail-title">Request {mockRequest.displayId}</h1>
            <span className="admin-badge in-progress" style={{ marginTop: "4px" }}>
              Evaluating
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="admin-detail-section">
          <h2 className="admin-detail-section-title">Customer Information</h2>
          <div className="admin-customer-name">{mockRequest.customer.name}</div>
          <div className="admin-customer-contact">{mockRequest.customer.email}</div>
          <div className="admin-customer-contact">{mockRequest.customer.phone}</div>
          <div className="admin-customer-contact" style={{ marginTop: "8px", fontSize: "13px", whiteSpace: "pre-line" }}>
            {mockRequest.customer.address}
          </div>
        </div>

        {/* Timeline */}
        <div className="admin-detail-section">
          <h2 className="admin-detail-section-title">Timeline</h2>
          <div className="admin-timeline">
            {mockRequest.timeline.map((item, index) => (
              <div key={index} className="admin-timeline-item">
                <div className="admin-timeline-text">{item.event}</div>
                <div className="admin-timeline-date">{item.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Item Form */}
        <div className="admin-detail-section">
          <h2 className="admin-detail-section-title">Add Item</h2>
          <form onSubmit={handleAddItem}>
            <div className="admin-form-group">
              <label className="admin-form-label">Item Type</label>
              <select
                className="admin-form-select"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
                <option value="">Select type...</option>
                <option value="ring">Ring</option>
                <option value="necklace">Necklace</option>
                <option value="bracelet">Bracelet</option>
                <option value="earrings">Earrings</option>
                <option value="watch">Watch</option>
                <option value="coins">Coins</option>
                <option value="bars">Bars/Ingots</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Weight (grams)</label>
                <input
                  type="number"
                  step="0.1"
                  className="admin-form-input"
                  placeholder="0.0"
                  value={itemWeight}
                  onChange={(e) => setItemWeight(e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Purity</label>
                <select
                  className="admin-form-select"
                  value={itemPurity}
                  onChange={(e) => setItemPurity(e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="10K">10K Gold</option>
                  <option value="14K">14K Gold</option>
                  <option value="18K">18K Gold</option>
                  <option value="22K">22K Gold</option>
                  <option value="24K">24K Gold</option>
                  <option value="sterling">Sterling Silver</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <textarea
                className="admin-form-textarea"
                placeholder="Describe the item..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-full" style={{ justifyContent: "center" }}>
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                Add Photos
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #E5E5E5", marginTop: "8px" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>Estimated Value:</span>
              <span style={{ fontSize: "18px", fontWeight: 600, color: "#AD7B2A" }}>${estimatedValue}</span>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary admin-btn-full" style={{ marginTop: "8px" }}>
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Item
            </button>
          </form>
        </div>

        {/* Items List */}
        <div className="admin-detail-section">
          <h2 className="admin-detail-section-title">Logged Items ({mockRequest.items.length})</h2>

          <div className="admin-items-list">
            {mockRequest.items.map((item) => (
              <div key={item.id} className="admin-item-card">
                <div style={{ width: "50px", height: "50px", background: "linear-gradient(135deg, #D4AF37 0%, #AD7B2A 100%)", borderRadius: "8px", marginRight: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" fill="white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                  </svg>
                </div>
                <div className="admin-item-info">
                  <div className="admin-item-name">{item.name}</div>
                  <div className="admin-item-meta">{item.weight} &bull; {item.description}</div>
                </div>
                <div className="admin-item-value">{item.value}</div>
                <div className="admin-item-actions">
                  <button className="admin-item-action-btn" title="Edit">
                    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="admin-total-bar">
            <span className="admin-total-label">Total Value</span>
            <span className="admin-total-value">{mockRequest.totalValue}</span>
          </div>
        </div>

        {/* Generate Offer Button */}
        <div style={{ position: "fixed", bottom: "70px", left: 0, right: 0, padding: "16px", background: "linear-gradient(to top, #FFFDF7 80%, transparent)", zIndex: 50 }}>
          <button className="admin-btn admin-btn-primary admin-btn-full" style={{ fontSize: "16px", padding: "16px" }}>
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            Generate Offer - {mockRequest.totalValue}
          </button>
        </div>
      </main>
    </div>
  );
}
