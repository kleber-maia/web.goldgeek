"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminHeader from "@/components/admin/AdminHeader";
import { saveCompanySettings } from "@/lib/actions/admin/settings.actions";

interface CompanySettings {
  name: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string | null;
  supportEmail?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  fedexValuableServiceType?: string | null;
  fedexKitDeliveryServiceType?: string | null;
  updatedAt?: string | Date;
}

// FedEx domestic service types (must match the values FedEx's Ship API accepts).
const FEDEX_SERVICE_OPTIONS = [
  { value: "FEDEX_GROUND", label: "FedEx Ground (1–5 business days)" },
  { value: "FEDEX_EXPRESS_SAVER", label: "FedEx Express Saver (3 business days, air)" },
  { value: "FEDEX_2_DAY", label: "FedEx 2Day (2 business days, air)" },
  { value: "FEDEX_2_DAY_AM", label: "FedEx 2Day A.M. (2 business days by noon)" },
  { value: "STANDARD_OVERNIGHT", label: "Standard Overnight (next business day PM)" },
  { value: "PRIORITY_OVERNIGHT", label: "Priority Overnight (next business day ~10:30am)" },
  { value: "FIRST_OVERNIGHT", label: "First Overnight (next business day early AM)" },
];

interface IntegrationStatus {
  fedex: {
    clientId: boolean;
    clientSecret: boolean;
    accountNumber: boolean;
    sandboxMode: boolean;
  };
  resend: {
    apiKey: boolean;
    emailFrom: string;
  };
}

interface Props {
  initialSettings: CompanySettings | null;
  integrations: IntegrationStatus;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        background: ok ? "#F0FDF4" : "#FEF2F2",
        border: `1px solid ${ok ? "#BBF7D0" : "#FECACA"}`,
        borderRadius: "6px",
        fontSize: "13px",
      }}
    >
      <span style={{ fontSize: "16px" }}>{ok ? "✓" : "✗"}</span>
      <span style={{ color: ok ? "#166534" : "#991B1B" }}>{label}</span>
    </div>
  );
}

export default function SettingsClient({ initialSettings, integrations }: Props) {
  const [settings, setSettings] = useState<CompanySettings>(
    initialSettings ?? {
      name: "Gold Geek",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      supportEmail: "",
      websiteUrl: "",
      instagramUrl: "",
      facebookUrl: "",
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const result = await saveCompanySettings({
      name: settings.name,
      street1: settings.street1,
      street2: settings.street2 || undefined,
      city: settings.city,
      state: settings.state,
      zipCode: settings.zipCode,
      phone: settings.phone,
      email: settings.email || undefined,
      supportEmail: settings.supportEmail || undefined,
      websiteUrl: settings.websiteUrl || undefined,
      instagramUrl: settings.instagramUrl || undefined,
      facebookUrl: settings.facebookUrl || undefined,
      fedexValuableServiceType: settings.fedexValuableServiceType || undefined,
      fedexKitDeliveryServiceType: settings.fedexKitDeliveryServiceType || undefined,
    });

    setIsSaving(false);

    if (result.success) {
      setFeedback({ type: "success", message: "Settings saved successfully." });
      if (result.data) setSettings(result.data);
    } else {
      setFeedback({ type: "error", message: result.error || "Failed to save settings." });
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader title="Settings" />

        <div className="admin-content">
          {/* Integration Status */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            {/* FedEx */}
            <div className="admin-section" style={{ marginBottom: 0 }}>
              <div className="admin-section-title" style={{ marginBottom: "12px" }}>
                FedEx Shipping
              </div>
              {(() => {
                const { clientId, clientSecret, accountNumber, sandboxMode } = integrations.fedex;
                const allSet = clientId && clientSecret && accountNumber;
                return (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <StatusBadge ok={clientId} label="Client ID" />
                      <StatusBadge ok={clientSecret} label="Client Secret" />
                      <StatusBadge ok={accountNumber} label="Account Number" />
                    </div>
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#6B7280", lineHeight: "1.6" }}>
                      {allSet ? (
                        <span style={{ color: "#166534" }}>
                          {sandboxMode ? "Running in sandbox mode." : "Connected to production."}
                        </span>
                      ) : (
                        "Configure missing variables in your .env file to enable shipping labels."
                      )}
                    </div>

                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E5E7EB" }}>
                      <div className="admin-form-group" style={{ marginBottom: "12px" }}>
                        <label className="admin-form-label">
                          Service — valuables (inbound &amp; returns)
                        </label>
                        <select
                          className="admin-form-input"
                          value={settings.fedexValuableServiceType ?? "PRIORITY_OVERNIGHT"}
                          onChange={(e) => handleChange("fedexValuableServiceType", e.target.value)}
                        >
                          {FEDEX_SERVICE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                          Carries gold/jewelry — ship fast by air.
                        </div>
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label">
                          Service — kit delivery (empty kit out)
                        </label>
                        <select
                          className="admin-form-input"
                          value={settings.fedexKitDeliveryServiceType ?? "FEDEX_GROUND"}
                          onChange={(e) => handleChange("fedexKitDeliveryServiceType", e.target.value)}
                        >
                          {FEDEX_SERVICE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                          No valuables in transit — Ground is fine and cheaper.
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "10px" }}>
                        Saved with the Save Settings button below.
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Resend */}
            <div className="admin-section" style={{ marginBottom: 0 }}>
              <div className="admin-section-title" style={{ marginBottom: "12px" }}>
                Email (Resend)
              </div>
              {(() => {
                const { apiKey, emailFrom } = integrations.resend;
                return (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <StatusBadge ok={apiKey} label="API Key" />
                      <StatusBadge ok={!!emailFrom} label={emailFrom ? `Sender: ${emailFrom}` : "Sender Email (EMAIL_FROM)"} />
                    </div>
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#6B7280", lineHeight: "1.6" }}>
                      {apiKey && emailFrom ? (
                        <span style={{ color: "#166534" }}>
                          Emails will be sent from {emailFrom}.
                        </span>
                      ) : (
                        "Configure missing variables in your .env file to enable transactional emails."
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Company / Shipper Address */}
          <div className="admin-section">
            <div className="admin-section-title" style={{ marginBottom: "16px" }}>
              Company &amp; Shipper Address
            </div>

            {feedback && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  background: feedback.type === "success" ? "#D1FAE5" : "#FEE2E2",
                  color: feedback.type === "success" ? "#065F46" : "#991B1B",
                }}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label className="admin-form-label">Company Name *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={settings.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Street Address *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={settings.street1}
                  onChange={(e) => handleChange("street1", e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Suite / Unit (optional)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={settings.street2 ?? ""}
                  onChange={(e) => handleChange("street2", e.target.value)}
                  placeholder="Suite 100"
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">City *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={settings.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    required
                  />
                </div>
                <div className="admin-form-group" style={{ maxWidth: "80px" }}>
                  <label className="admin-form-label">State *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={settings.state}
                    onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                    maxLength={2}
                    placeholder="TX"
                    required
                  />
                </div>
                <div className="admin-form-group" style={{ maxWidth: "120px" }}>
                  <label className="admin-form-label">ZIP *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={settings.zipCode}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                    placeholder="75201"
                    required
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Phone *</label>
                  <input
                    type="tel"
                    className="admin-form-input"
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(833) 446-5343"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Sender Email (for outgoing emails)</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={settings.email ?? ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="noreply@example.com"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Support Email (shown to customers)</label>
                <input
                  type="email"
                  className="admin-form-input"
                  value={settings.supportEmail ?? ""}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  placeholder="support@example.com"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Website URL</label>
                <input
                  type="url"
                  className="admin-form-input"
                  value={settings.websiteUrl ?? ""}
                  onChange={(e) => handleChange("websiteUrl", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Instagram URL</label>
                  <input
                    type="url"
                    className="admin-form-input"
                    value={settings.instagramUrl ?? ""}
                    onChange={(e) => handleChange("instagramUrl", e.target.value)}
                    placeholder="https://www.instagram.com/yourpage"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Facebook URL</label>
                  <input
                    type="url"
                    className="admin-form-input"
                    value={settings.facebookUrl ?? ""}
                    onChange={(e) => handleChange("facebookUrl", e.target.value)}
                    placeholder="https://www.facebook.com/yourpage"
                  />
                </div>
              </div>

              {settings.updatedAt && (
                <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>
                  Last saved:{" "}
                  {new Date(settings.updatedAt).toLocaleString()}
                </div>
              )}

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Saving\u2026" : "Save Settings"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
