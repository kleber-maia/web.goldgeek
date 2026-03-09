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
  updatedAt?: string | Date;
}

interface Props {
  initialSettings: CompanySettings | null;
}

export default function SettingsClient({ initialSettings }: Props) {
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
          {/* FedEx Configuration notice */}
          <div className="admin-section" style={{ marginBottom: "24px" }}>
            <div className="admin-section-title" style={{ marginBottom: "12px" }}>
              FedEx Integration Status
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              {[
                { label: "Client ID", envVar: "FEDEX_CLIENT_ID" },
                { label: "Account Number", envVar: "FEDEX_ACCOUNT_NUMBER" },
                { label: "Sandbox Mode", envVar: "FEDEX_SANDBOX_MODE" },
                { label: "Webhook Secret", envVar: "FEDEX_WEBHOOK_SECRET" },
              ].map(({ label, envVar }) => (
                <div
                  key={envVar}
                  style={{
                    padding: "12px 16px",
                    background: "#FFFDF7",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ color: "#6B7280", marginBottom: "4px" }}>{label}</div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#2E1F0C",
                    }}
                  >
                    {envVar}
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        background: "#FEF3C7",
                        color: "#92400E",
                      }}
                    >
                      Configure in .env
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: "12px",
                fontSize: "13px",
                color: "#6B7280",
                lineHeight: "1.5",
              }}
            >
              Set the env variables above in your <code>.env</code> file.
              Webhook endpoint: <code style={{ color: "#AD7B2A" }}>/api/webhooks/fedex</code>
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
                    placeholder="5551234567"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email (optional)</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={settings.email ?? ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="ops@goldgeek.com"
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
                {isSaving ? "Saving…" : "Save Settings"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
