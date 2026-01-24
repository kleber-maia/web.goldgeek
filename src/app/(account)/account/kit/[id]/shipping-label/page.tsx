"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AccountContainer } from "@/components/account";
import {
  getSession,
  getKitById,
  getCustomerById,
  GOLDGEEK_ADDRESS,
  generateKitNumber,
  Customer,
} from "@/lib/account";

export default function ShippingLabelPage() {
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/account/login");
      return;
    }

    const kit = getKitById(kitId);
    if (!kit) {
      router.replace("/account");
      return;
    }

    const customerData = getCustomerById(session.userId);
    setCustomer(customerData || null);

    // Generate a mock tracking number
    const prefix = "7489";
    const random = Math.floor(Math.random() * 10000000000)
      .toString()
      .padStart(10, "0");
    setTrackingNumber(prefix + random);

    setIsLoading(false);
  }, [router, kitId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AccountContainer
        headerProps={{
          showBackButton: true,
          backHref: `/account/kit/${kitId}`,
          title: "Shipping Label",
        }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--status-gray)" }}>Loading...</p>
        </div>
      </AccountContainer>
    );
  }

  return (
    <AccountContainer
      headerProps={{
        showBackButton: true,
        backHref: `/account/kit/${kitId}`,
        title: "Shipping Label",
      }}
    >
      {/* Label Container */}
      <div className="account-label-container">
        <div className="account-label-header">
          <svg
            width="80"
            height="24"
            viewBox="0 0 80 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="0"
              y="18"
              fill="#4D148C"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              fontSize="16"
            >
              FedEx
            </text>
          </svg>
          <span
            style={{
              fontSize: 12,
              color: "var(--status-gray)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Pre-Paid Shipping Label
          </span>
        </div>

        <div className="account-label-content">
          {/* From Address */}
          <div className="account-label-address-box">
            <div className="account-label-address-label">From:</div>
            <div className="account-label-address-text">
              {customer?.name || "Customer"}
              <br />
              {customer?.address ? (
                <>
                  {customer.address.street}
                  <br />
                  {customer.address.city}, {customer.address.state}{" "}
                  {customer.address.zip}
                </>
              ) : (
                "Address on file"
              )}
            </div>
          </div>

          {/* To Address */}
          <div className="account-label-address-box">
            <div className="account-label-address-label">To:</div>
            <div className="account-label-address-text">
              <strong>{GOLDGEEK_ADDRESS.name}</strong>
              <br />
              {GOLDGEEK_ADDRESS.street}
              <br />
              {GOLDGEEK_ADDRESS.city}, {GOLDGEEK_ADDRESS.state}{" "}
              {GOLDGEEK_ADDRESS.zip}
            </div>
          </div>

          {/* Barcode */}
          <div className="account-label-barcode">
            <div
              style={{
                height: 60,
                background:
                  "repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 5px, #fff 5px, #fff 8px)",
                marginBottom: 8,
              }}
            />
            <div className="account-label-tracking">{trackingNumber}</div>
          </div>

          {/* Reference */}
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--status-gray)",
            }}
          >
            Reference: Kit #{generateKitNumber(kitId)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="account-label-actions">
        <button
          onClick={handlePrint}
          className="account-btn account-btn-primary"
        >
          <svg
            width="18"
            height="18"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
            />
          </svg>
          Print Label
        </button>
        <button
          onClick={() => {
            // In a real app, this would download a PDF
            alert("In production, this would download a PDF of the label.");
          }}
          className="account-btn account-btn-secondary"
        >
          <svg
            width="18"
            height="18"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Save PDF
        </button>
      </div>

      {/* Instructions */}
      <div className="account-label-instructions">
        <div className="account-label-instructions-title">
          Shipping Instructions
        </div>
        <ol className="account-label-instructions-list">
          <li>Print this label on a full sheet of paper</li>
          <li>Cut along the edges and tape securely to your package</li>
          <li>Place your items in a sturdy box with padding</li>
          <li>Drop off at any FedEx location or schedule a pickup</li>
        </ol>
      </div>
    </AccountContainer>
  );
}
