# Unshipped kit management plan

- [x] Enforce one awaiting-shipment kit under the existing customer lock and reuse cancellation with customer ownership checks.
- [x] Add cancellation confirmation, cancelled-state guidance, and existing-kit request navigation; preview mobile and desktop.
- [x] Add concurrency, boundary, and lifecycle regression tests; run four-lens review, update docs, and pass full verification.

## Verification

- Full isolated verification passed: lint, TypeScript, 65 tests, production build. New coverage includes different-ID account/public races, legacy duplicates, cancellation ownership/idempotency, carrier movement, unresolved operations, outbound physical boxes, and label invalidation.
- Internal browser at 375px and 1280px: direct request blocked with existing-kit navigation; Cancel kit confirmation, Keep kit, Escape and restored focus; cancellation updates status/timeline and removes labels; replacement request succeeds; a second stale form is rejected and links to the existing kit; admin shows Cancelled and Voided; simulated inbound pickup removes cancellation and unlocks requests. No horizontal overflow on checked views.
- Four-lens review: Reuse and Altitude found no actionable changes. Efficiency reduced label payloads under the lock and removed redundant refresh. Quality identified missing guidance during unresolved carrier preparation; added explanation and support link.
- UI finish audit passed for changed controls and states. Packing instructions remain on the kit detail; the redundant dashboard Next steps panel is removed.
- Browser mutations used disposable development customers and fake labels. Automated tests used fresh loopback-only databases. No production kit was cancelled during verification. No schema migration is required.
