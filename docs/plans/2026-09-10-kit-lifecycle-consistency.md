# Plan: Kit lifecycle consistency

Spec: docs/specs/2026-09-10-kit-lifecycle-consistency.md
Date: 2026-09-10

## Tasks

- [x] 1. Protect customer offer visibility and unify lifecycle presentation.
  - Files: account policy, customer services/actions, customer and admin kit views.
  - Steps: require sentAt; derive stages from shipment direction, PDF issuance, and returns; remove conflicting overrides.
  - Verify: preview both kit types, expired offers, and long status labels.
- [x] 2. Align manual shipping, activity, and delivery notifications.
  - Files: kit/shipping services, customer activity, notification service and email.
  - Steps: use shared transitions; protect cancellation; record issuance/delivery milestones; add packing reminder.
  - Verify: preview manual shipment controls and customer milestones.
- [x] 3. Present working preview and obtain feedback.
  - Files: affected dashboard views.
  - Steps: start local preview and present the acceptance checks.
  - Verify: operator accepts the working preview before final checks.
- [x] 4. Finish regression coverage and verification after preview acceptance.
  - Files: lifecycle, shipping, offer visibility, customer activity and notification tests.
  - Steps: add isolated regression cases; simplify; update documentation; run lifecycle and full verification once; hand off.
  - Verify: tests pass, mobile and desktop work, and toolkit gates pass.

## Open questions

None. The audit and documented lifecycle define the accepted outcome.

## Review and validation notes

- Operator authorized the remaining review fixes and shipping on September 10.
- Claude review follow-ups: label withdrawal messages now identify the shipment leg; delayed pickup scans fill missing historical dates without reopening delivered shipments or sending stale notifications. Imported labels may legitimately have pickup dates before their creation.
- Four-lens cleanup review completed; the imported-label chronology correction was applied.
- Focused regression tests and TypeScript checks passed. Coverage includes offer privacy, PDF-free summaries, issuance milestones, cancellation, shipment direction, duplicate carrier events, and late pickup recovery.
- Customer home, list, and kit detail were checked in the local preview at 375px and 1200px; labels wrap without horizontal overflow. The current browser has a customer session, so authenticated admin visual checks were unavailable. Admin data and transition behavior are covered by regression tests.
- Lifecycle gate passed with no findings. Full release verification passed: lint, TypeScript, complete isolated test suite, and production build. Authenticated admin visual verification remains limited as noted above.
