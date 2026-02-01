"use client";

import { use } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

// Mock data for offer detail
const mockOffer = {
  id: "o1",
  displayId: "Offer #O1",
  amount: "$384.98",
  status: "pending",
  expiresDate: "Jan 17, 2025",
  customer: {
    name: "David Brown",
    initials: "DB",
    email: "david.brown@email.com",
  },
  items: [
    { name: "Sterling Silver Tennis Bracelet", weight: "22.5g", purity: "Sterling Silver (.925)", value: "$19.13" },
    { name: "14K Gold Hoop Earrings", weight: "3.8g", purity: "14K Gold", value: "$140.60" },
    { name: "10K Gold Class Ring", weight: "8.5g", purity: "10K Gold", value: "$225.25" },
  ],
  timeline: [
    { event: "Offer sent to customer", date: "Jan 10, 2025" },
    { event: "Evaluation completed", date: "Jan 10, 2025" },
    { event: "Package received", date: "Jan 9, 2025" },
    { event: "Package shipped by customer", date: "Jan 8, 2025" },
    { event: "Physical kit mailed", date: "Jan 5, 2025" },
    { event: "Kit requested", date: "Jan 5, 2025" },
  ],
  requestId: "r097",
};

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In production, id would be used to fetch the offer from the API
  const _params = use(params);
  void _params.id;

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        {/* Mobile Header */}
        <header className="admin-header">
          <Link href="/admin/offers" className="admin-back-btn">
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <span className="admin-header-title">{mockOffer.displayId}</span>
          <div style={{ width: "40px" }} />
        </header>

        {/* Offer Status Banner */}
        <div style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", padding: "20px", margin: "16px", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#92400E", marginBottom: "8px" }}>
            Pending Response
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#92400E" }}>{mockOffer.amount}</div>
          <div style={{ fontSize: "13px", color: "#B45309", marginTop: "8px" }}>Expires {mockOffer.expiresDate}</div>
        </div>

        {/* Customer Info */}
        <div className="admin-form-section" style={{ margin: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Customer</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#AD7B2A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "16px", fontWeight: 600 }}>
              {mockOffer.customer.initials}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#2E1F0C" }}>{mockOffer.customer.name}</div>
              <div style={{ fontSize: "13px", color: "#6B7280" }}>{mockOffer.customer.email}</div>
            </div>
            <Link href={`/admin/customers/c5`} style={{ marginLeft: "auto", color: "#AD7B2A", textDecoration: "none", fontSize: "13px" }}>View Profile</Link>
          </div>
        </div>

        {/* Item Breakdown */}
        <div className="admin-form-section" style={{ margin: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Items ({mockOffer.items.length})</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {mockOffer.items.map((item, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontWeight: 500, color: "#2E1F0C" }}>{item.name}</div>
                  <div style={{ fontSize: "13px", color: "#6B7280" }}>{item.weight} &bull; {item.purity}</div>
                </div>
                <div style={{ fontWeight: 600, color: "#AD7B2A" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", marginTop: "16px", borderTop: "2px solid #eee" }}>
            <span style={{ fontWeight: 600, color: "#2E1F0C" }}>Total Offer</span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#AD7B2A" }}>{mockOffer.amount}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="admin-form-section" style={{ margin: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Timeline</h3>

          <div className="admin-timeline">
            {mockOffer.timeline.map((item, index) => (
              <div key={index} className="admin-timeline-item">
                <div className="admin-timeline-text">{item.event}</div>
                <div className="admin-timeline-date">{item.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="admin-btn admin-btn-primary" style={{ flex: 1, minWidth: "140px" }}>
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Resend Offer
          </button>
          <button className="admin-btn admin-btn-secondary" style={{ flex: 1, minWidth: "140px" }}>
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit Offer
          </button>
        </div>

        {/* Related Links */}
        <div style={{ padding: "0 16px 16px" }}>
          <Link href={`/admin/requests/${mockOffer.requestId}`} className="admin-btn admin-btn-secondary" style={{ width: "100%", textAlign: "center", textDecoration: "none" }}>
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View Original Request #R097
          </Link>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
