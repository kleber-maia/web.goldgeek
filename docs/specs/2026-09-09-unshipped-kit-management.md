# Unshipped kit management

## Context
Customers cannot cancel their own unused kit, and can open several requests while a previous one still awaits preparation or shipment.

## Decision
Expose a confirmed Cancel kit action on owned kits before inbound carrier movement. Reuse the existing cancellation transition, timeline, and durable label-void queue so admin and customer views agree. Block a new kit while any existing kit is PENDING/SHIPPED without inbound movement. Enforce this under the existing customer lock across account, public, and staff creation paths; a retry with the same request ID still returns its existing kit.

The dashboard continues the existing kit, and direct request URLs explain the block with a link to it. Successful cancellation permits a new request unless another legacy pending kit exists. Carrier movement, not printing, releases the request restriction. Physical box delivery does not count as sending items inbound.

## Alternatives
- Disable one button only: other tabs and direct submissions bypass it.
- Delete cancelled kits: loses history and shipping reconciliation.
- Allow customer cancellation after inbound movement: cannot safely recall items already handed to the carrier.

## Consequences and acceptance
No migration or retrospective cancellation. Pre-existing duplicates must each be shipped or cancelled. Pending/uncertain carrier operations remain a temporary cancellation guard with an explanation and support link. The redundant dashboard Next steps panel is removed; packing instructions remain inside the kit. Test ownership, concurrent requests with different IDs, account/public races, repeated cancellation, stale carrier state, label voiding, and post-cancellation creation. Verify confirmation/keep-kit behavior and blocked-request recovery at 375px and desktop.
