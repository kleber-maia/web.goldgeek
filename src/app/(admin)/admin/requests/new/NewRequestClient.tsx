"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { createKitForCustomer } from "@/lib/actions/admin/kit.actions";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  addresses: Array<{
    id: string;
    type: string;
    street1: string;
    street2: string | null;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export default function NewRequestClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [kitType, setKitType] = useState<"PHYSICAL" | "DIGITAL">("DIGITAL");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCustomers = customerSearch.length >= 2
    ? customers.filter((c) => {
        const term = customerSearch.toLowerCase();
        return (
          c.email.toLowerCase().includes(term) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(term)
        );
      }).slice(0, 10)
    : [];

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.firstName} ${customer.lastName} (${customer.email})`);
    setShowDropdown(false);

    // Pre-fill address
    const addr = customer.addresses.find((a) => a.type === "shipping" && a.isDefault)
      || customer.addresses.find((a) => a.type === "shipping")
      || customer.addresses[0];
    if (addr) {
      setStreet1(addr.street1);
      setStreet2(addr.street2 || "");
      setCity(addr.city);
      setState(addr.state);
      setZipCode(addr.zipCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("Please select a customer.");
      return;
    }
    if (!street1 || !city || !state || !zipCode) {
      setError("Please fill in all required address fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await createKitForCustomer({
        customerId: selectedCustomer.id,
        kitType,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        notes: notes || undefined,
        shippingAddress: {
          street1,
          street2: street2 || undefined,
          city,
          state,
          zipCode,
        },
      });

      if (result.success) {
        router.push(`/admin/requests/${result.data.id}`);
      } else {
        setError(result.error || "Failed to create kit");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#2E1F0C",
    boxSizing: "border-box" as const,
  };

  return (
    <div className="admin-container">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader title="New Kit Request" backHref="/admin/requests" />

        {error && (
          <div style={{ padding: "12px 16px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 600, color: "#2E1F0C" }}>Customer</h3>
            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setSelectedCustomer(null);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name or email..."
              />
              {showDropdown && filteredCustomers.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  borderRadius: "0 0 6px 6px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}>
                  {filteredCustomers.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 12px",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid #F3F4F6",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "#2E1F0C" }}>
                        {c.firstName} {c.lastName}
                      </span>
                      <span style={{ color: "#6B7280", marginLeft: "8px" }}>{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#065F46", background: "#D1FAE5", padding: "8px 12px", borderRadius: "6px" }}>
                Selected: {selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.email})
              </div>
            )}
          </div>

          {/* Kit Type */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 600, color: "#2E1F0C" }}>Kit Type</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["DIGITAL", "PHYSICAL"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setKitType(type)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: kitType === type ? "2px solid #AD7B2A" : "1px solid #D1D5DB",
                    borderRadius: "8px",
                    background: kitType === type ? "#FFFDF7" : "#fff",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: kitType === type ? 600 : 400,
                    color: kitType === type ? "#AD7B2A" : "#2E1F0C",
                  }}
                >
                  {type === "DIGITAL" ? "Digital Kit" : "Physical Kit"}
                </button>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 600, color: "#2E1F0C" }}>Shipping Address</h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#57370D", marginBottom: "4px" }}>Street *</label>
              <input style={inputStyle} value={street1} onChange={(e) => setStreet1(e.target.value)} required />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#57370D", marginBottom: "4px" }}>Apt / Suite</label>
              <input style={inputStyle} value={street2} onChange={(e) => setStreet2(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#57370D", marginBottom: "4px" }}>City *</label>
                <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#57370D", marginBottom: "4px" }}>State *</label>
                <select style={{ ...inputStyle, background: "#fff" }} value={state} onChange={(e) => setState(e.target.value)} required>
                  <option value="">--</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#57370D", marginBottom: "4px" }}>ZIP *</label>
                <input style={inputStyle} value={zipCode} onChange={(e) => setZipCode(e.target.value)} maxLength={10} required />
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 600, color: "#2E1F0C" }}>Details (Optional)</h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#57370D", marginBottom: "4px" }}>Estimated Value</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="$0.00" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#57370D", marginBottom: "4px" }}>Notes</label>
              <textarea style={{ ...inputStyle, minHeight: "80px" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this kit" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "14px",
              background: submitting ? "#D1C4A9" : "#AD7B2A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Creating..." : "Create Kit Request"}
          </button>
        </form>
      </main>

      <AdminBottomNav />
    </div>
  );
}
