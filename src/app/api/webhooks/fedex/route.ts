import { NextResponse } from 'next/server';
import { ShippingService } from '@/lib/services/shipping.service';
import type { FedExTrackingWebhookPayload, FedExTrackingEvent } from '@/lib/fedex/types';
import type { ShippingLabelStatus } from '@prisma/client';
import { buildBaseUrlFromRequest, resolveBaseUrl } from '@/lib/url';

// ---------------------------------------------------------------------------
// Map FedEx event codes → ShippingLabelStatus
// Reference: https://developer.fedex.com/api/en-us/catalog/tracking/v1/docs.html
// ---------------------------------------------------------------------------

const EVENT_CODE_MAP: Record<string, ShippingLabelStatus> = {
  // Picked up / on vehicle
  PU: 'IN_TRANSIT',
  OC: 'IN_TRANSIT',
  // In transit
  IT: 'IN_TRANSIT',
  AR: 'IN_TRANSIT', // arrived at facility
  DP: 'IN_TRANSIT', // departed facility
  AO: 'IN_TRANSIT', // at origin facility
  // Out for delivery
  OD: 'IN_TRANSIT',
  // Delivered
  DL: 'DELIVERED',
  // Exception / problem
  DE: 'EXCEPTION',
  CA: 'EXCEPTION', // cancelled
  RS: 'EXCEPTION', // return to sender
  SE: 'EXCEPTION', // service exception
};

function mapEventCode(code: string): ShippingLabelStatus | null {
  return EVENT_CODE_MAP[code.toUpperCase()] ?? null;
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

function verifySignature(request: Request, body: string): boolean {
  const secret = process.env.FEDEX_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret configured, skip verification (development only)
    console.warn('FEDEX_WEBHOOK_SECRET not set — skipping webhook signature verification');
    return true;
  }

  const signature = request.headers.get('x-fedex-signature') ??
    request.headers.get('x-signature');

  if (!signature) {
    return false;
  }

  // FedEx uses HMAC-SHA256 hex digest
  // We can't use crypto.createHmac in Edge runtime, but this route runs in Node
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 });
  }

  if (!verifySignature(request, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: FedExTrackingWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const baseUrl = resolveBaseUrl(
      buildBaseUrlFromRequest(request),
      process.env.NEXT_PUBLIC_APP_URL
    );
    await processWebhookPayload(payload, baseUrl);
  } catch (err) {
    console.error('FedEx webhook processing error:', err);
    // Return 200 to avoid FedEx retrying — log the error internally
    return NextResponse.json({ ok: true, warning: 'Processing error logged' }, { status: 200 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processWebhookPayload(
  payload: FedExTrackingWebhookPayload,
  baseUrl?: string
): Promise<void> {
  const trackingInfo = payload.trackingInfo;
  const trackingNumber =
    trackingInfo?.trackingNumber ??
    trackingInfo?.trackingNumberInfo?.trackingNumber ??
    payload.trackingNumber;

  if (!trackingNumber) {
    console.warn('FedEx webhook: no tracking number found in payload');
    return;
  }

  // Determine the most significant event code from the payload
  const latestCode = trackingInfo?.latestStatusDetail?.code;
  const derivedCode = trackingInfo?.latestStatusDetail?.derivedCode;

  // Also scan the events array for the most recent event
  const events: FedExTrackingEvent[] = trackingInfo?.events ?? [];
  const eventCodes = [
    ...(latestCode ? [latestCode] : []),
    ...(derivedCode ? [derivedCode] : []),
    ...events.map((e) => e.eventType),
  ];

  let newStatus: ShippingLabelStatus | null = null;
  for (const code of eventCodes) {
    const mapped = mapEventCode(code);
    if (mapped) {
      newStatus = mapped;
      // Prefer DELIVERED > EXCEPTION > IN_TRANSIT
      if (mapped === 'DELIVERED') break;
    }
  }

  if (!newStatus) {
    console.log(`FedEx webhook: no actionable status for tracking ${trackingNumber}, codes: ${eventCodes.join(', ')}`);
    return;
  }

  // Look up the label in our database
  const label = await ShippingService.getByTrackingNumber(trackingNumber);
  if (!label) {
    console.warn(`FedEx webhook: no label found for tracking number ${trackingNumber}`);
    return;
  }

  // Only advance status — never go backwards
  const statusOrder: ShippingLabelStatus[] = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'VOIDED'];
  const currentIndex = statusOrder.indexOf(label.status as ShippingLabelStatus);
  const newIndex = statusOrder.indexOf(newStatus);

  if (newStatus === 'EXCEPTION' || newIndex > currentIndex) {
    await ShippingService.updateStatus(label.id, newStatus, undefined, baseUrl);
    console.log(`FedEx webhook: updated label ${label.id} (${trackingNumber}) → ${newStatus}`);
  } else {
    console.log(`FedEx webhook: skipped status update for ${trackingNumber} (${label.status} → ${newStatus} is not an advance)`);
  }
}
