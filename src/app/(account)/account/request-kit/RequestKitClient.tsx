"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountContainer } from "@/components/account";
import { createKitFromAccount } from "@/lib/actions/customer.actions";

interface Address {
  id: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zipCode: string;
}

interface Props {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  defaultAddress: Address | null;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export default function RequestKitClient({ defaultAddress }: Props) {
  const router = useRouter();
  const [kitType, setKitType] = useState<"PHYSICAL" | "DIGITAL">("DIGITAL");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [street1, setStreet1] = useState(defaultAddress?.street1 || "");
  const [street2, setStreet2] = useState(defaultAddress?.street2 || "");
  const [city, setCity] = useState(defaultAddress?.city || "");
  const [state, setState] = useState(defaultAddress?.state || "");
  const [zipCode, setZipCode] = useState(defaultAddress?.zipCode || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street1 || !city || !state || !zipCode) {
      setError("Please fill in all required address fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await createKitFromAccount({
        kitType,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        notes: notes || undefined,
        shippingAddress: {
          type: "shipping" as const,
          street1,
          street2: street2 || undefined,
          city,
          state,
          zipCode,
          country: "US",
          isDefault: !defaultAddress,
        },
      });

      if (result.success) {
        router.push(`/account/kit/${result.data.id}`);
      } else {
        setError(result.error || "Failed to create kit request");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    form: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "20px",
    },
    section: {
      background: "#FFFFFF",
      border: "1px solid #E5E5E5",
      borderRadius: "8px",
      padding: "20px",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#2E1F0C",
      margin: "0 0 16px 0",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 500,
      color: "#57370D",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #D1D5DB",
      borderRadius: "6px",
      fontSize: "14px",
      color: "#2E1F0C",
      boxSizing: "border-box" as const,
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #D1D5DB",
      borderRadius: "6px",
      fontSize: "14px",
      color: "#2E1F0C",
      background: "#FFFFFF",
      boxSizing: "border-box" as const,
    },
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
    },
    row3: {
      display: "grid",
      gridTemplateColumns: "1fr 80px 100px",
      gap: "12px",
    },
    field: {
      marginBottom: "12px",
    },
    typeToggle: {
      display: "flex",
      gap: "8px",
    },
    typeBtn: (active: boolean) => ({
      flex: 1,
      padding: "12px",
      border: active ? "2px solid #AD7B2A" : "1px solid #D1D5DB",
      borderRadius: "8px",
      background: active ? "#FFFDF7" : "#FFFFFF",
      cursor: "pointer",
      textAlign: "center" as const,
    }),
    typeBtnTitle: (active: boolean) => ({
      fontSize: "14px",
      fontWeight: 600,
      color: active ? "#AD7B2A" : "#2E1F0C",
      margin: "0 0 4px 0",
    }),
    typeBtnDesc: {
      fontSize: "12px",
      color: "#6B7280",
      margin: 0,
    },
    submitBtn: {
      width: "100%",
      padding: "14px",
      background: submitting ? "#D1C4A9" : "#AD7B2A",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: 600,
      cursor: submitting ? "default" : "pointer",
    },
    error: {
      padding: "12px 16px",
      background: "#FEE2E2",
      color: "#DC2626",
      borderRadius: "8px",
      fontSize: "14px",
    },
    hint: {
      fontSize: "12px",
      color: "#6B7280",
      marginTop: "4px",
    },
  };

  return (
    <AccountContainer
      headerProps={{
        title: "Request New Kit",
        backHref: "/account",
      }}
    >
      <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 20px 0", lineHeight: 1.5 }}>
        Request a new appraisal kit. We&apos;ll evaluate your items and send you an offer.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Kit Type */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Kit Type</h3>
          <div style={styles.typeToggle}>
            <button
              type="button"
              style={styles.typeBtn(kitType === "DIGITAL")}
              onClick={() => setKitType("DIGITAL")}
            >
              <p style={styles.typeBtnTitle(kitType === "DIGITAL")}>Digital Kit</p>
              <p style={styles.typeBtnDesc}>Print a shipping label at home</p>
            </button>
            <button
              type="button"
              style={styles.typeBtn(kitType === "PHYSICAL")}
              onClick={() => setKitType("PHYSICAL")}
            >
              <p style={styles.typeBtnTitle(kitType === "PHYSICAL")}>Physical Kit</p>
              <p style={styles.typeBtnDesc}>We&apos;ll mail you a kit box</p>
            </button>
          </div>
        </div>

        {/* Shipping Address */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Shipping Address</h3>
          <div style={styles.field}>
            <label style={styles.label}>Street Address *</label>
            <input
              style={styles.input}
              value={street1}
              onChange={(e) => setStreet1(e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Apt / Suite</label>
            <input
              style={styles.input}
              value={street2}
              onChange={(e) => setStreet2(e.target.value)}
              placeholder="Apt 4B"
            />
          </div>
          <div style={styles.row3}>
            <div>
              <label style={styles.label}>City *</label>
              <input
                style={styles.input}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={styles.label}>State *</label>
              <select
                style={styles.select}
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              >
                <option value="">--</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>ZIP *</label>
              <input
                style={styles.input}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={10}
                required
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Details (Optional)</h3>
          <div style={styles.field}>
            <label style={styles.label}>Estimated Value</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="$0.00"
            />
            <p style={styles.hint}>Your best guess — this helps us prioritize.</p>
          </div>
          <div>
            <label style={styles.label}>Notes</label>
            <textarea
              style={{ ...styles.input, minHeight: "80px", resize: "vertical" as const }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what you're sending (e.g., 3 gold rings, 1 necklace)"
            />
          </div>
        </div>

        <button type="submit" style={styles.submitBtn} disabled={submitting}>
          {submitting ? "Submitting..." : "Request Kit"}
        </button>
      </form>
    </AccountContainer>
  );
}
