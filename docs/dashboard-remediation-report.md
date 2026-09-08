# Customer dashboard audit and remediation

Date: 2026-09-08. Scope: customer `/account/*`, its authentication and public intake entry points, and the shared admin offer/payment/shipping workflows. The original [43-finding audit](audits/2026-09-08-customer-dashboard.md) remains the historical baseline. This report describes the resulting implementation, evidence, and remaining limitations.

## Decisions and scope

The operator authorized fixes and development-browser tests without repeated preview approval. Successful internal-browser checks were used as acceptance. The FAQ's **$1,000 default shipping insurance** is authoritative. Existing 10% bonus and 24-hour turnaround wording remains by explicit operator choice; no automatic promotion engine or new service guarantee was invented.

The staff-engineer toolkit 0.2.0 is installed locally with project skills, configuration, lifecycle checks and test/build gates. Work is a single broad remediation concern. Production migration, push and deployment are separate release actions. The local verified batch is committed only after explicit operator approval.

## Finding disposition

“Implemented” means the repair is present; the verification boundaries below still apply. No finite suite proves every possible input or third-party behavior.

| ID | Resulting behavior |
|---|---|
| F01 | Implemented: random opaque sessions are hashed in the database, expire, rotate and revoke. Forged IDs and unsigned legacy cookies cannot authenticate. |
| F02 | Implemented: offer decisions authenticate the customer and lock/check the owning kit before any mutation. |
| F03 | Implemented: address create/update/delete are customer-scoped, validated and serialized for default selection. |
| F04 | Implemented: public intake cannot overwrite an existing customer's identity without that customer's session. Creation is atomic and request-idempotent. |
| F05 | Implemented: cron handlers reject absent or incorrect secrets; FedEx signatures are validated strictly. Failed processing responds with a retryable failure. |
| F06 | Implemented: payout credentials use AES-256-GCM envelopes; customer/admin list DTOs omit or mask credentials. Staff destination access is explicit and audited. Legacy conversion script is available; development dry run found no plaintext records. |
| F07 | Implemented: database-backed issuance limits and atomic token consumption prevent duplicate consumption and uncontrolled per-email requests. |
| F08 | Implemented: role-specific local return paths reject external/control/backslash destinations. Canonical email origins ignore request-controlled headers. |
| F09 | Implemented: decisions require current SENT offer, unexpired deadline and OFFER_SENT kit. Stale tabs receive a specific rejection. |
| F10 | Implemented: kit-locked transactions commit the decision, payment/return, timeline and notification together. Identical retries reuse the result; opposite decisions reject. |
| F11 | Implemented: offer creation/sending serializes on the kit, supersedes prior actionable offers, and sets seven days from sending. Latest-send ordering and server checks agree. |
| F12 | Implemented: offer details use immutable item snapshots, including quantity and zero values. Before an offer, inventory is complete without disclosing draft appraisal values. |
| F13 | Implemented: each payment method requires a valid destination. Acceptance records an encrypted destination snapshot; later preferences cannot redirect an accepted payment. |
| F14 | Implemented: acceptance starts with the saved default; Check, ACH, Zelle, PayPal and Venmo are consistently available. |
| F15 | Implemented: failed payments retry the existing unique payment obligation, preserving its destination and amount. A duplicate payment row is not created. |
| F16 | Implemented: customer payment states distinguish pending/processing/sent/completed/failed. Refresh and support/retry paths retain context. Staff totals include sent payments. |
| F17 | Implemented: digital inbound transit advances the kit to SHIPPED. |
| F18 | Implemented: manual and webhook return delivery atomically update return, label, kit RETURNED and completion time. |
| F19 | Implemented: ordered, deduplicated carrier events recover from exceptions without regressing delivery. A failed return can resume transit consistently. |
| F20 | Implemented: durable notification/carrier jobs retry with fenced leases and provider idempotency. Uncertain label creation requires reconciliation; saved carrier results recover without another purchase. |
| F21 | Implemented: cancellation is terminal and deliberately limited to pre-appraisal PENDING/SHIPPED kits. Inbound items in transit/delivered/exception and unresolved carrier requests block cancellation. Unused labels are queued for voiding. Later callbacks cannot revive the kit. |
| F22 | Implemented: active label selection excludes voided labels. Reservations prevent duplicate carrier purchases. Pending void confirmation blocks replacement, including races during address validation. Manual recovery can attach a missing PDF to the same unshipped label. |
| F23 | Implemented: missing/corrupt carrier data displays an honest unavailable state; fabricated prepaid labels/barcodes were removed. |
| F24 | Implemented: export validates the carrier PDF and waits for rendered label pages. Every original carrier page is copied into the exported PDF. Saved-PDF visual inspection remains blocked by browser policy; see limits. |
| F25 | Policy resolved: $1,000 default coverage replaces $5,000. Bonus and turnaround copy retained as requested. These are operational promises, not automatically enforced benefits. |
| F26 | Implemented: responsive reading layout is separate from print layout; label previews include every PDF page. Mobile and desktop previews were checked. Physical printer/barcode validation remains external. |
| F27 | Implemented: invalid-link recovery is no longer hidden by stale client “email sent” state. |
| F28 | Implemented: protected deep links survive login and expired sessions; check-email and callback entry points are reachable. |
| F29 | Implemented: explicit independent customer/admin magic-link flows; mock callback/auth behavior removed. |
| F30 | Implemented: customers without first/last name must complete their profile before requesting a kit. |
| F31 | Implemented: account/public request and customer/admin address/profile inputs use server validation. Request identities prevent duplicate submissions. |
| F32 | Implemented: clearing optional phone/address-unit fields clears stored values. |
| F33 | Implemented: forms show the actual kit destination snapshot. Customers explicitly apply their current shipping address before payout/return preparation; prepared or shipped destinations are protected. |
| F34 | Implemented: changing the preferred method preserves previously saved method destinations. |
| F35 | Implemented: shared status/offer/label predicates drive counts and next actions. Full-history totals are aggregated separately from bounded previews; item counts sum quantities. |
| F36 | Implemented: Returns and Activity are discoverable from the dashboard. |
| F37 | Implemented: timeline order/details are preserved through a customer-safe event projection. |
| F38 | Implemented: page retry boundaries and inline mutation errors replace misleading redirects; navigation/filter context is preserved. |
| F39 | Implemented: labeled controls, visible keyboard focus, dialog focus containment/Escape/restore, status announcements, stronger contrast, skip link and unrestricted zoom. This is targeted accessibility verification, not a formal certification. |
| F40 | Implemented: mobile/desktop headings, identity, navigation and shared dialogs are consistent. Staff payment history now has mobile cards. |
| F41 | Implemented as Activity: the feed uses an explicit customer event allowlist and excludes arbitrary internal notes, identities and metadata. Read/unread inbox semantics are not claimed. |
| F42 | Implemented: 20-row server pagination for kits/payments/returns/activity, stable ordering, bounded dashboard queries and URL-based kit search/status/page state. |
| F43 | Implemented: isolated PostgreSQL integration tests, lint/type/build gates and a CI workflow. Dependencies upgraded; dependency audit reports zero vulnerabilities at verification time. Internal-browser checks supplement automated service tests. |

## Verification and flow coverage

Final local results: **51 automated tests passed**, no failures or skips; TypeScript and production build passed; ESLint passed with zero errors (20 advisory warnings, principally native PDF images, unused compatibility parameters and existing public components). The lifecycle gate passed with two advisory native-select notices; the accessible existing select controls were retained. `npm audit` reported **zero vulnerabilities**. The full-verification receipt covers the final staged source. No test, lint or lifecycle rule was disabled to obtain a pass.

The automated runner creates a new loopback-only PostgreSQL cluster and a separate database per test file, applies every migration, disables provider credentials and removes successful temporary clusters. It never reads the development database URL. Tests include concurrency, authorization, malformed input, transaction rollback, replay, expiry, immutable destinations and provider failure simulation.

| Test file | Coverage |
|---|---|
| session | Genuine identities, opaque tokens, tamper/expiry/revocation and rotation |
| authentication | Role separation, atomic magic-link use, issuance limits and safe redirects |
| endpoint-security | Fail-closed background authentication and canonical email origin |
| customer-ownership | Foreign address rejection, field allowlists, optional clearing and concurrent defaults |
| kit-request | Atomic/idempotent public and account requests, existing-customer protection and identity prerequisites |
| offer-decision | Ownership, expiry, opposite/duplicate decisions, concurrent offer changes and accepted snapshots |
| payment-details | Encryption, masking, destination validation and payment retry invariants |
| shipping | Directional transitions, exception recovery, delivery, cancellation/replay, rollback and fenced delivery workers |
| shipping-generation | Concurrent purchase protection, uncertain/saved recovery, invalid address, cancellation, PDF attachment and reservation races |
| digital-kit | Invalid PDF rejection and preservation of original multipage carrier pages |
| dashboard-policy | Status groups, deadline rules, digital eligibility and customer event privacy |
| customer-history | Pagination/totals/ownership, private events, destination correction and manual return transitions |

Internal-browser exercises used genuine local magic links and tagged development fixtures. Customer checks included invalid/expired/forged/replayed authentication, deep-link recovery, empty/active/history pages, search/page navigation, all primary account routes, physical and digital requests, public intake, incomplete profile, profile/address editing and clearing, payment method validation/save/masking, accepted check and declined offer, expired-offer rejection, return-address confirmation, Digital Kit valid/missing/corrupt/physical states, multipage rendering and export generation. Staff checks included payment processing/sent progression, carrier-state visibility, cancellation recovery and manual PDF uploads. Keyboard testing confirmed dialog focus wrap, Escape and focus restoration.

UI checks used 375px mobile and desktop widths of at least 1024px. After a browser viewport override stopped affecting a newly created tab, later 375px checks used a local read-only iframe preview at the actual width. Earlier viewport checks and later iframe checks are distinguished; an ineffective override was not counted as a mobile pass.

### All 35 lifecycle scenarios

| Scenarios | Coverage/disposition |
|---|---|
| 1–4 physical/digital accept/decline | Request, decision, payout and return services covered; successful customer decisions and corresponding staff transitions exercised in browser. Real transfer/shipment excluded. |
| 5–7 expiry/reoffer/cancel | Deadline and superseding-offer tests; expired UI checked. Cancellation after appraisal is now intentionally rejected so items cannot disappear from fulfillment. |
| 8–9 draft/repeated offers | Snapshot privacy, serialization, current-offer guard and seven-day-from-send behavior covered. |
| 10–14 five payout methods | All method validators/snapshots covered; browser checked Check acceptance and ACH/PayPal settings, plus all method controls. No external transfers executed. |
| 15 failed payment | Same-obligation retry covered with preserved amount/destination. |
| 16–21 cancellation | Permitted pre-appraisal cancellation and terminal callback protection covered; later-stage cancellation is rejected in favor of completing payment/return. |
| 22–24 return exception/reissue/failure | Shared transitions, failed-return retry, void confirmation and manual PDF recovery covered. |
| 25 invalid carrier address | Mock carrier rejection creates no shipment; correction/error UI exercised. |
| 26 kit type switch | Ownership/state/label protections covered; read-only terminal UI checked. |
| 27 inbound exception | Ordered exception/delivery/replay tests and browser fixture transitions. |
| 28 customer never ships | Kit remains SHIPPED with preparation guidance. No invented automatic deadline or reminder policy. |
| 29–32 account creation/request histories | Public/account atomic request tests and browser requests; existing admin entry points preserved and shared services validated. |
| 33 edits after offer | Customer snapshot is independent of later item mutations. |
| 34 address change | Explicit apply-current-address action with preparation locks and immutable accepted payment destination. |
| 35 deletion cascade | Schema retains hard-delete semantics. No deletion of existing business records was tested; retention/archival is an optional product capability, not silently introduced. |

## Remaining limits and optional improvements

- The internal browser generated the export but **blocked opening the generated PDF blob**. Downloads-directory access was also unavailable. No alternate route was used to bypass that policy. Original-page structure and multipage on-screen rendering are verified; saved-packet visual layout and physical barcode scanning remain unverified.
- Development tests used disabled email/carrier credentials and mocked provider responses. They do not establish live Resend delivery, FedEx label certification, a real shipment, or payout-provider settlement.
- CI configuration is present; a hosted CI run will occur after the change is published. Local checks are the verification evidence for this uncommitted work. Browser checks are manual internal-browser exercises, not a checked-in automated end-to-end browser suite.
- Refund/reversal operations, item image uploads, a USPS purchasing API, no-printer fulfillment, downloadable acceptance receipts, customer cancellation requests, and hard-delete replacement/retention are optional product work. They are not represented as existing features.
- Operational rows retain replay/deduplication evidence. Do not age-delete carrier receipts or sent outbox keys without defining replay horizons or durable tombstones. Expired authentication-row cleanup and monitored queue reporting are useful maintenance follow-ups.
- Production rollout requires all five migrations and a persistent per-environment payment encryption key before code deployment. See the deployment runbook. The development legacy-payment conversion dry run found zero plaintext records; production must be assessed separately.

## Review and release status

Four simplify lenses ran concurrently (Reuse, Quality, Efficiency, and the primary agent's Altitude review). Applied fixes include shared transition ownership, removal of duplicate action-side return updates, reusable offer/method rules, PDF parsing cleanup, minimal initial reads, single-job outbox leases and bounded customer histories. Real shipping races identified during review received fixes and regression tests.

The final repository verification receipt is generated by the staff-engineer lifecycle/full-verification commands. No production release is implied by this report.
