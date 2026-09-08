import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { ShippingTransitionService } from '@/lib/services/shipping-transition.service';
import { ShippingService } from '@/lib/services/shipping.service';
import type { FedExTrackingWebhookPayload, FedExTrackingEvent } from '@/lib/fedex/types';
import type { ShippingLabelStatus } from '@prisma/client';

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
    return false;
  }

  const signature = request.headers.get('x-fedex-signature') ??
    request.headers.get('x-signature');

  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
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
    await processWebhookPayload(payload, createHash('sha256').update(rawBody).digest('hex'));
  } catch (err) {
    console.error('FedEx webhook processing error:', err);
    return NextResponse.json({ error: 'Processing failed; retry this event' }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processWebhookPayload(
  payload: FedExTrackingWebhookPayload,
  receiptId: string
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

  const events: FedExTrackingEvent[] = trackingInfo?.events ?? [];
  const dated = events.map(event => ({ event, time: Date.parse(event.timestamp || event.eventTime || '') })).filter(entry => Number.isFinite(entry.time)).sort((a, b) => b.time - a.time);
  const latest = dated[0];
  const code = latest?.event.eventType || trackingInfo?.latestStatusDetail?.derivedCode || trackingInfo?.latestStatusDetail?.code || events[0]?.eventType;
  const newStatus = code ? mapEventCode(code) : null;
  if (!newStatus) return;
  const rawTime = latest?.time ?? Date.parse(payload.eventTime || '');
  const eventAt = Number.isFinite(rawTime) ? new Date(rawTime) : new Date();

  // Look up the label in our database
  const label = await ShippingService.getByTrackingNumber(trackingNumber);
  if (!label) {
    console.warn(`FedEx webhook: no label found for tracking number ${trackingNumber}`);
    return;
  }

  await ShippingTransitionService.apply(label.id, newStatus, undefined, eventAt, receiptId);
}
