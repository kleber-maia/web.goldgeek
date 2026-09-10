# Kit lifecycle consistency

Date: 2026-09-10
Status: agreed — operator requested all seven audit fixes

## Context

Customers can see discarded drafts and misleading shipping stages. Manual shipping
updates can leave cancellation available. Issuance and empty-kit delivery are missing
from customer activity, and empty-kit delivery does not send a packing reminder.

## Decision

Implement the current kit lifecycle guide across customer views and related admin
controls. Derive stages from existing shipment and return records, use a saved carrier
PDF as issuance evidence, and keep packet access separate from issuance. Expose only
offers with a sending timestamp. Route manual shipment updates through the same
transactional shipping transition used by carrier events. Add safe milestone activity
and a delivery reminder through the existing notification queue.

## Alternatives considered

- Rename badges only: leaves unsafe cancellation and missing events unresolved.
- Expand kit status enums: unnecessary when shipment records already identify each leg.

## Consequences

No schema migration is required. Staff must save a shipment label/tracking record
before marking it shipped or delivered. Existing discarded drafts become private
without changing historical data. Existing manually shipped digital kits remain
protected from cancellation even when their carrier evidence is incomplete.

## Acceptance

- Follow both kit types and confirm every stage matches docs/kit-lifecycle.md.
- Replace a draft and confirm no unsent amount reaches customer views.
- Mark items shipped as staff and confirm customer cancellation is unavailable.
- Confirm issuance and empty-kit delivery appear in activity and delivery queues a reminder.
- Confirm longer status labels fit mobile and desktop.

## Non-goals

Production deployment, live-data cleanup, and unrelated dashboard redesign.

## Review follow-ups

Shipment-label withdrawal activity identifies the affected leg and warns customers
not to use a withdrawn inbound label. Carrier pickup events received after delivery
can restore missing shipment dates and one historical timeline event, including
for manually imported labels. They cannot reopen a delivered shipment, overwrite
known dates, advance the carrier watermark, or queue a stale shipment email.
