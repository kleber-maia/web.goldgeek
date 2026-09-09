"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { appendCarrierLabel } from "@/lib/account/digital-kit-pdf";
import { useParams } from "next/navigation";
import { AccountContainer } from "@/components/account";
import { getDigitalKitData, recordDigitalKitAccess } from "@/lib/actions/customer.actions";
import type { DigitalKitData } from "@/lib/actions/customer.actions";

export default function DigitalKitPage() {
  const params = useParams();
  const kitId = params.id as string;

  const [data, setData] = useState<DigitalKitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labelImages, setLabelImages] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [documentNotice, setDocumentNotice] = useState<string | null>(null);
  const [packetUrl, setPacketUrl] = useState<string | null>(null);
  const [labelRenderFailed, setLabelRenderFailed] = useState(false);

  useEffect(() => () => {
    if (packetUrl) URL.revokeObjectURL(packetUrl);
  }, [packetUrl]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const result = await getDigitalKitData(kitId);
        if (!isMounted) return;
        if (!result.success || !result.data) {
          setError(result.error || "Failed to load Digital Kit");
          setIsLoading(false);
          return;
        }
        setData(result.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [kitId]);

  // Render FedEx PDF to image using pdfjs-dist
  useEffect(() => {
    if (!data?.labelData) return;

    let cancelled = false;

    // Timeout: if rendering takes too long, fall back to iframe
    const timeout = setTimeout(() => {
      if (!cancelled) setLabelRenderFailed(true);
    }, 8000);

    const renderPdf = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const binary = atob(data.labelData!);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        const images: string[] = [];
        try {
          for (let number = 1; number <= pdf.numPages; number++) {
            if (cancelled) return;
            const page = await pdf.getPage(number);
            const viewport = page.getViewport({ scale: 3 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Unable to render carrier label');
            await page.render({ canvasContext: context, viewport, canvas }).promise;
            images.push(canvas.toDataURL('image/png'));
            page.cleanup();
          }
          clearTimeout(timeout);
          if (!cancelled) setLabelImages(images);
        } finally { await pdf.destroy(); }

      } catch (err) {
        console.error("PDF rendering failed:", err);
        clearTimeout(timeout);
        if (!cancelled) setLabelRenderFailed(true);
      }
    };

    renderPdf();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [data?.labelData]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const saveProgress = async () => {
    if (!data || data.packetAccessedAt || isSavingProgress) return;
    setIsSavingProgress(true);
    setProgressError(null);
    try {
      const result = await recordDigitalKitAccess(kitId, data.labelId);
      if (!result.success || !result.data) throw new Error(result.error);
      setData(current => current ? { ...current, packetAccessedAt: result.data! } : current);
    } catch {
      setProgressError("We couldn’t save your progress. Retry, or reload your kit if its shipping label has changed.");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handlePrint = () => {
    setDownloadError(null);
    const originalTitle = document.title;
    document.title = `Appraisal Kit - ${data?.kitNumber ?? "Gold Geek"}`;
    try {
      window.print();
      setDocumentNotice("Print dialog opened. If you cancelled, you can print again whenever you’re ready.");
      void saveProgress();
    } catch {
      setDownloadError("Printing could not open. Try again or download the kit to print it from your PDF reader.");
    } finally {
      document.title = originalTitle;
    }
  };

  const handleDownloadPdf = async () => {
    const element = wrapperRef.current;
    if (!element) return;

    if (!data?.labelData || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    const clone = element.cloneNode(true) as HTMLDivElement;
    clone.querySelectorAll('.dk-label-page').forEach(page => page.remove());
    clone.classList.add('dk-export');
    clone.style.width = '7.5in';
    clone.style.minWidth = '7.5in';
    try {
      await document.fonts.ready;
      const html2pdf = (await import("html2pdf.js")).default;
      const instructions = await html2pdf().set({ margin: [0.5, 0.5, 0.5, 0.5], image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 816 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'], before: '.dk-page-break' } }).from(clone).outputPdf('arraybuffer');
      const packet = await appendCarrierLabel(instructions, data.labelData);
      const url = URL.createObjectURL(new Blob([new Uint8Array(packet)], { type: 'application/pdf' }));
      setPacketUrl(url);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Appraisal Kit - ${data.kitNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDocumentNotice("Your PDF is ready. Print its pages before packing your items.");
      await saveProgress();
    } catch {
      setDownloadError('Unable to create the packet. Retry, or use the label-only download under More download options.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <AccountContainer
        headerProps={{ showBackButton: true, backHref: `/account/kit/${kitId}`, title: "Digital Kit" }}
      >
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{
            width: 32, height: 32,
            border: "3px solid var(--account-border)", borderTopColor: "var(--brand-primary)",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }} />
          <p style={{ color: "var(--status-gray)" }}>Preparing your Digital Kit...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </AccountContainer>
    );
  }

  if (error || !data) {
    return (
      <AccountContainer
        headerProps={{ showBackButton: true, backHref: `/account/kit/${kitId}`, title: "Digital Kit" }}
      >
        <div style={{
          textAlign: "center", padding: "60px 24px",
          background: "var(--status-error-bg, #fef2f2)", borderRadius: 12, margin: 16,
        }}>
          <p style={{ color: "var(--status-error, #dc2626)", fontWeight: 600, marginBottom: 8 }}>
            Unable to load Digital Kit
          </p>
          <p style={{ color: "var(--status-gray)", fontSize: 14 }}>
            {error || "No data available"}
          </p>
          <button type="button" className="account-btn account-btn-primary" onClick={() => window.location.reload()}>Retry</button>
          <Link className="account-btn account-btn-secondary" href={`/account/kit/${kitId}`}>Back to kit</Link>
        </div>
      </AccountContainer>
    );
  }

  const returnByDate = new Date(data.kitCreatedAt);
  returnByDate.setDate(returnByDate.getDate() + 7);
  const returnByStr = returnByDate.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <AccountContainer
      headerProps={{ showBackButton: true, backHref: `/account/kit/${kitId}`, title: "Digital Kit" }}
    >
      <section className="digital-kit-toolbar account-section" aria-label="Prepare your digital kit">
        <h2 className="text-lg font-semibold mb-2">{data.packetAccessedAt ? "Next: pack and drop off" : "Print your shipping documents"}</h2>
        <p className="text-sm mb-4">{data.packetAccessedAt
          ? "Put your items and printed customer information card in a sturdy package. Attach the prepaid label, then take it to a staffed FedEx location."
          : "Print now or save the PDF to print later. Both include your instructions, customer information card, and prepaid shipping label."}</p>
        {downloadError && <p role="alert" className="account-alert account-alert-error">{downloadError}</p>}
        {documentNotice && <p role="status" className="text-sm mb-3">{documentNotice}</p>}
        {progressError && <div role="alert" className="account-alert account-alert-error"><p>{progressError}</p><div className="flex flex-wrap gap-4"><button type="button" disabled={isSavingProgress} onClick={() => void saveProgress()} className="underline">{isSavingProgress ? "Saving…" : "Retry saving progress"}</button><button type="button" onClick={() => window.location.reload()} className="underline">Reload kit</button></div></div>}
      {/* Action buttons — responsive, outside fixed-width document */}
      <div className="digital-kit-actions">
        <button onClick={handlePrint} disabled={labelImages.length === 0 || isDownloading} className="account-btn account-btn-primary">
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          {data.packetAccessedAt ? "Print again" : "Print kit"}
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={!data.labelData || isDownloading}
          className="account-btn account-btn-secondary"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {isDownloading ? "Preparing download..." : (data.packetAccessedAt ? "Download again" : "Download PDF")}
        </button>
      </div>

        {!data.packetAccessedAt && !progressError && <button type="button" disabled={isSavingProgress || !data.labelData} onClick={() => void saveProgress()} className="text-sm underline mb-4">{isSavingProgress ? "Saving progress…" : "I’ve already printed this kit"}</button>}
        {data.packetAccessedAt && <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <Link href={`/account/kit/${kitId}`} className="underline">Continue to packing and tracking</Link>
          <a href="https://local.fedex.com/en/staffed-drop-off" target="_blank" rel="noopener noreferrer" className="underline">Find a staffed FedEx location</a>
        </div>}
        {data.labelData && <details className="text-sm border-t border-[var(--account-border)] pt-3">
          <summary className="cursor-pointer">More download options</summary>
          <p className="mt-3 mb-2">The complete kit already includes your shipping label. Use this only if you need a separate copy.</p>
          <a className="underline" href={`data:application/pdf;base64,${data.labelData}`} download={`Carrier Label - ${data.kitNumber}.pdf`}>Download shipping label only</a>
          {packetUrl && <p className="mt-2 mb-0"><a className="underline" href={packetUrl} download={`Appraisal Kit - ${data.kitNumber}.pdf`}>Save the prepared PDF again</a></p>}
        </details>}
      </section>

      {/* Scrollable container — allows horizontal scroll on narrow screens */}
      <div className="digital-kit-scroll">
      <div className="digital-kit-wrapper" ref={wrapperRef}>
        {/* ============ PAGE 1: Welcome Letter ============ */}
        <div className="digital-kit-page">
          <div className="dk-welcome-header">
            <img src="/images/logos/GoldGeekLogo-horizontal.png" alt="Gold Geek" />
            <div className="dk-welcome-meta">
              <strong>{data.customer.email}</strong><br />
              Kit ID: {data.kitNumber}<br />
              Tracking: {data.trackingNumber || "Pending"}
            </div>
          </div>

          <hr className="dk-separator" />

          <div className="dk-welcome-body">
            <h2>Dear {data.customer.firstName},</h2>

            <p>
              Thank you for choosing {data.company.name}! We&apos;re excited to help you turn your
              precious metals and jewelry into cash — quickly, safely, and with the highest payouts
              in the industry.
            </p>

            <p>Here&apos;s everything you need to get started:</p>

            <ul>
              <li>
                <strong>Prepaid FedEx shipping label included</strong> — print the included carrier label pages
                and follow the carrier instructions when attaching the label to your package.
              </li>
              <li>
                <strong>FedEx drop-off locations</strong> — use the <a href="https://local.fedex.com/en/staffed-drop-off" target="_blank" rel="noopener noreferrer">FedEx location finder</a> to choose a staffed drop-off location near you.
              </li>
              <li>
                <strong>Insurance coverage</strong> — your shipment is automatically insured
                for up to $1,000.
              </li>
              <li>
                <strong>Satisfaction guarantee</strong> — if you&apos;re not happy with our offer,
                we&apos;ll return your items at no cost.
              </li>
            </ul>

            <p>
              Track the status of your kit at any time from your{" "}
              <strong>Gold Geek Dashboard</strong>. Once we receive your items, you&apos;ll have
              an offer within 24 hours.
            </p>

            <div className="dk-closing">
              <strong>{data.company.name} Team</strong>
              {data.company.phone} &bull; {data.company.email}
            </div>
          </div>

          {/* FedEx Locations Table */}
          {data.fedexLocations.length > 0 && (<>
            <h3 className="dk-locations-title">FedEx Drop-Off Locations Near You</h3>
            <table className="dk-locations-table">
              <thead>
                <tr>
                  <th>Street</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Zip</th>
                  <th>Distance</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {data.fedexLocations.map((loc, i) => (
                  <tr key={i}>
                    <td>{loc.street}</td>
                    <td>{loc.city}</td>
                    <td>{loc.state}</td>
                    <td>{loc.zip}</td>
                    <td>{loc.distance}</td>
                    <td>{loc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>)}
        </div>

        {/* ============ PAGE 2: Customer Information Card ============ */}
        <div className="digital-kit-page dk-page-break">
          <div className="dk-info-header">
            <h2>Customer Information Card</h2>
            <div className="dk-kit-number">{data.kitNumber}</div>
          </div>

          <div className="dk-info-section">
            <h3>Your Information</h3>
            <div className="dk-info-grid">
              <div className="dk-field">
                <span className="dk-field-label">Name</span>
                <span className="dk-field-value">
                  {data.customer.firstName} {data.customer.lastName}
                </span>
              </div>
              <div className="dk-field">
                <span className="dk-field-label">Email</span>
                <span className="dk-field-value">{data.customer.email}</span>
              </div>
              <div className="dk-field">
                <span className="dk-field-label">Phone</span>
                <span className="dk-field-value">{data.customer.phone || ""}</span>
              </div>
              <div className="dk-field">
                <span className="dk-field-label">Mailing Address</span>
                <span className="dk-field-value">
                  {data.customer.address.street1}
                  {data.customer.address.street2 && `, ${data.customer.address.street2}`}
                  , {data.customer.address.city}, {data.customer.address.state}{" "}
                  {data.customer.address.zip}
                </span>
              </div>
            </div>
          </div>

          <div className="dk-info-section">
            <h3>Your Items</h3>
            <div className="dk-items-columns">
              <ol className="dk-items-list">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i}>
                    <span>{i + 1}.</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #ccc", minHeight: 18 }}>&nbsp;</span>
                  </li>
                ))}
              </ol>
              <ol className="dk-items-list">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i + 5}>
                    <span>{i + 6}.</span>
                    <span style={{ flex: 1, borderBottom: "1px solid #ccc", minHeight: 18 }}>&nbsp;</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="dk-bottom-split">
            <div className="dk-terms">
              <h4>Terms &amp; Conditions</h4>
              <p style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.4, margin: "0 0 10px" }}>
                By signing below, I agree to the Gold Geek Terms of Service and confirm that
                I am the legal owner of the items being sent for appraisal.
              </p>
              <div className="dk-signature-line">
                <div className="dk-line" />
                <span>Signature</span>
              </div>
              <div className="dk-signature-line">
                <div className="dk-line" />
                <span>Date of Birth</span>
              </div>
            </div>

            <div className="dk-payment">
              <h4>Payment preference</h4>
              <p>Choose and confirm your payment destination securely in your dashboard when you accept your offer. Do not write bank account details on this card.</p>
            </div>
          </div>

          <div className="dk-card-footer">
            <img src="/images/logos/GoldGeekLogo-horizontal.png" alt="Gold Geek" />
            <span>{data.company.phone} &bull; {data.company.email}</span>
            <span>
              {data.company.street1}, {data.company.city}, {data.company.state} {data.company.zip}
            </span>
          </div>
        </div>

        {/* ============ PAGE 3: 10% Bonus Promo ============ */}
        <div className="digital-kit-page dk-promo dk-page-break">
          <div className="dk-coupon">
            <img src="/images/logos/GoldGeekLogo-horizontal.png" alt="Gold Geek" />

            <div className="dk-promo-badge">Customer Appreciation</div>

            <div className="dk-promo-amount">10%</div>
            <div className="dk-promo-amount-label">BONUS</div>

            <hr className="dk-promo-divider" />

            <p className="dk-promo-copy">
              We know you have a choice when it comes to selling your gold online, and
              we&apos;re thankful for the trust and confidence you&apos;re placing in us. To show
              our appreciation, we&apos;re offering a <strong>10% BONUS</strong> on top of the value
              of your gold. Simply return this card with your completed Appraisal Kit{" "}
              <strong>within 7 days</strong> to claim your extra money.
            </p>

            <div className="dk-promo-deadline">
              Return by: {returnByStr}
            </div>

            <p className="dk-promo-fine">
              Bonus offer excludes coins, bullion, bars and diamonds. Total payout with bonus
              cannot exceed 90% of melt value of sent items. Not valid with other special
              offers; exceptions may apply. This promotion may be modified or rescinded at any
              time at the sole discretion of Gold Geek.
            </p>
          </div>
        </div>

        {/* ============ PAGE 4: FedEx Shipping Label ============ */}
        {labelImages.map((source, index) => <div key={index} className="digital-kit-page dk-label-page dk-page-break"><img src={source} alt={`FedEx Shipping Label page ${index + 1}`} /></div>)}
        {labelImages.length === 0 && <div className="digital-kit-page dk-label-page dk-page-break">
          {data.labelData && !labelRenderFailed ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--status-gray)" }}>
              Rendering shipping label...
            </div>
          ) : data.labelData && labelRenderFailed ? (
            /* PDF render failed — show embedded iframe for screen, hidden for print */
            <>
              <iframe
                src={`data:application/pdf;base64,${data.labelData}`}
                style={{ width: "100%", minHeight: "600px", border: "none", display: "block" }}
                title="FedEx Shipping Label"
              />
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--status-gray)", marginTop: 8 }}>
                To print the label, use the &quot;Download Digital Kit&quot; button above and print the PDF directly.
              </p>
            </>
          ) : (
            <p role="alert">Your carrier label is unavailable. Retry or contact support before shipping.</p>
          )}
        </div>}
      </div>
      </div>
    </AccountContainer>
  );
}
