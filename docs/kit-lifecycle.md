# Gold Geek — Appraisal Kit Lifecycle

A high-level guide to every scenario in the appraisal kit process, for QA and business reference.

---

## Actors

| Actor | Role |
|-------|------|
| **Customer** | Requests appraisal, ships items, responds to offers, receives payment or returned items |
| **Admin** | Manages shipping, evaluates items, generates offers, processes payments, handles returns |
| **System** | Sends emails, logs timeline events, manages sessions |

---

## Kit Types

```
┌─────────────────────────────────────────────────────┐
│                   PHYSICAL KIT                       │
│                                                     │
│  Company mails an empty kit box to the customer     │
│  with a prepaid return label inside.                │
│                                                     │
│  Customer packs items in the box and ships back.    │
│                                                     │
│  2 shipping labels: box delivery + prepaid return   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    DIGITAL KIT                       │
│                                                     │
│  Customer prints a shipping label from their        │
│  online dashboard and uses their own packaging.     │
│                                                     │
│  1 shipping label: prepaid inbound only             │
└─────────────────────────────────────────────────────┘
```

---

## Main Lifecycle Flow

```
                        ┌──────────┐
                        │ Customer │
                        │ requests │
                        │ appraisal│
                        └────┬─────┘
                             │
                             ▼
                     ┌───────────────┐
                     │    PENDING    │
                     └───────┬───────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
         Physical Kit                 Digital Kit
               │                           │
               ▼                           │
      ┌─────────────────┐                  │
      │ Admin ships kit │                  │
      │ box to customer │                  │
      └────────┬────────┘                  │
               │                           │
               └─────────────┬─────────────┘
                             │
                             ▼
                      ┌────────────┐
                      │  SHIPPED   │  ← Kit/label sent, items in transit
                      └──────┬─────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Items arrive at     │
                  │ Gold Geek           │
                  │ (auto-start eval)   │
                  └──────────┬──────────┘
                             │
                             ▼
                     ┌──────────────┐
                     │  EVALUATING  │  ← Admin inspects & values each item
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  OFFER_SENT  │  ← Admin generates & sends offer
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
         ┌──────────┐ ┌──────────┐ ┌───────────┐
         │ ACCEPTED │ │ DECLINED │ │  EXPIRED   │
         └────┬─────┘ └────┬─────┘ │ (7 days)  │
              │            │       └─────┬─────┘
              ▼            ▼             │
         ┌──────┐    ┌──────────┐       ▼
         │ PAID │    │ RETURNED │  Admin may create
         └──────┘    └──────────┘  a new offer
                                   (back to OFFER_SENT)

         ★ CANCELLED only before appraisal begins ★
```

---

## Detailed Phase Diagrams

### Phase 1: Kit Request & Creation

```
  ┌──────────────────────────────────────────────────────────┐
  │                     KIT REQUEST                          │
  │                                                          │
  │  WHO:  Customer (via website) or Admin (on behalf of)    │
  │                                                          │
  │  WHAT: Provide name, email, phone, shipping address,     │
  │        kit type (Physical/Digital), optional notes        │
  │        and estimated value                               │
  │                                                          │
  │  RESULT:                                                 │
  │    • Kit created in PENDING status                       │
  │    • Kit number assigned (GG-YYYY-XXXXXX)                │
  │    • Shipping address snapshot saved on kit              │
  │    • Customer account created (or updated if returning)  │
  │    • Magic login link emailed to customer                │
  │                                                          │
  │  EMAIL → Customer: "Kit Request Confirmed"               │
  └──────────────────────────────────────────────────────────┘
```

### Phase 2: Shipping — Getting Items to Gold Geek

```
  ┌────────────────────────── PHYSICAL KIT ──────────────────────────┐
  │                                                                  │
  │  Admin generates 2 FedEx labels:                                 │
  │    ① Kit Delivery label  (company → customer, ships empty box)   │
  │    ② Inbound label       (customer → company, prepaid return)    │
  │                                                                  │
  │  Admin ships box  ──→  Kit status: SHIPPED                      │
  │                        EMAIL → Customer: "Kit is on its way"     │
  │                                                                  │
  │  Customer receives box, packs items, ships back using ②          │
  │                                                                  │
  │  Items in transit ──→  Kit stays at SHIPPED                    │
  │                        EMAIL → Customer: "Package in transit"    │
  │                                                                  │
  │  Items arrive     ──→  Kit status: EVALUATING (auto)                      │
  │                        EMAIL → Customer: "We received your kit"  │
  └──────────────────────────────────────────────────────────────────┘

  ┌────────────────────────── DIGITAL KIT ───────────────────────────┐
  │                                                                  │
  │  Admin generates 1 FedEx label:                                  │
  │    ① Inbound label (customer → company)                          │
  │                                                                  │
  │  Customer prints label from their dashboard, packs own box       │
  │                                                                  │
  │  Items in transit ──→  Kit stays at SHIPPED                    │
  │                        EMAIL → Customer: "Package in transit"    │
  │                                                                  │
  │  Items arrive     ──→  Kit status: EVALUATING (auto)                      │
  │                        EMAIL → Customer: "We received your kit"  │
  └──────────────────────────────────────────────────────────────────┘
```

### Phase 3: Evaluation & Offer

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  Evaluation starts automatically when items arrive (EVALUATING)   │
  │  EMAIL → Customer: "We received your kit"                        │
  │                                                                  │
  │  Admin inspects each item:                                       │
  │    • Identifies type (jewelry, coins, bullion, scrap, watches)   │
  │    • Tests metal type (gold, silver, platinum, palladium)        │
  │    • Weighs items, determines purity (10K, 14K, 18K, 24K, etc.) │
  │    • Assigns appraised value to each item                        │
  │    • Can add/edit/remove items throughout evaluation              │
  │                                                                  │
  │  Admin generates offer:                                          │
  │    • Total = sum of all appraised values                         │
  │    • Item-by-item breakdown included                             │
  │    • Offer number assigned (OFF-YYYY-XXXXXX)                     │
  │    • 7-day expiration set                                        │
  │                                                                  │
  │  Admin sends offer  ──→  Kit status: OFFER_SENT                  │
  │                          EMAIL → Customer: "Your offer is ready  │
  │                          — $X,XXX.XX (7-day expiry)"             │
  └──────────────────────────────────────────────────────────────────┘
```

### Phase 4: Customer Response — Three Possible Outcomes

```
  ┌─────────────────── OUTCOME A: ACCEPT ───────────────────────────┐
  │                                                                  │
  │  Customer selects payment method:                                │
  │    Check | ACH | Zelle | PayPal | Venmo                          │
  │                                                                  │
  │  Customer confirms acceptance                                    │
  │    → Kit status: ACCEPTED                                        │
  │    → EMAIL → Admins: "Offer accepted — process payment"          │
  │                                                                  │
  │  Admin processes payment                                         │
  │    → Kit status: PAID                                            │
  │    → EMAIL → Customer: "Payment sent — $X,XXX.XX via [method]"   │
  │                                                                  │
  │  TERMINAL STATE: PAID                                            │
  └──────────────────────────────────────────────────────────────────┘

  ┌─────────────────── OUTCOME B: DECLINE ──────────────────────────┐
  │                                                                  │
  │  Customer confirms decline (irreversible)                        │
  │    → Kit status: DECLINED                                        │
  │    → Return automatically created                                │
  │    → EMAIL → Admins: "Offer declined — generate return label"    │
  │                                                                  │
  │  Admin generates return FedEx label (company → customer)         │
  │  Admin ships items back                                          │
  │    → EMAIL → Customer: "Items being returned" + tracking         │
  │                                                                  │
  │  Items delivered to customer                                     │
  │    → Kit status: RETURNED                                        │
  │    → EMAIL → Customer: "Items delivered"                          │
  │                                                                  │
  │  TERMINAL STATE: RETURNED                                        │
  └──────────────────────────────────────────────────────────────────┘

  ┌─────────────────── OUTCOME C: EXPIRES ──────────────────────────┐
  │                                                                  │
  │  7 days pass with no customer response                           │
  │    → Offer marked as expired                                     │
  │    → Kit stays at OFFER_SENT (no status change)                  │
  │    → EMAIL → Customer: "Offer expired — contact us"              │
  │                                                                  │
  │  What happens next:                                              │
  │    → Admin can generate a NEW offer (restart Phase 3 offer step) │
  │    → Cancellation unavailable after appraisal begins             │
  │    → Or customer contacts support to negotiate                   │
  │                                                                  │
  │  NON-TERMINAL: Awaiting admin/customer action                    │
  └──────────────────────────────────────────────────────────────────┘
```

### Cancellation (PENDING/SHIPPED only, before inbound shipment)

Customers can cancel an owned kit from its detail page after confirming the decision. Staff use the same transition. Cancellation is available only from `PENDING` or `SHIPPED`, before any inbound label reaches `IN_TRANSIT`, `DELIVERED`, or `EXCEPTION`. Sending a physical kit box to the customer does not count as the customer shipping their items.

Unresolved `STARTED` or `UNKNOWN` carrier operations temporarily block cancellation. The customer sees an explanation and support link. Cancellation marks the kit `CANCELLED`, records completion and timeline history, expires unused offers, and voids unused labels. FedEx voids use the durable retry queue. Later carrier callbacks cannot reopen a cancelled kit. There is no dedicated cancellation email.

### One request awaiting shipment

A customer cannot create another kit while any existing kit is `PENDING` or `SHIPPED` without inbound carrier movement. The dashboard shows **Continue your kit**; direct request URLs explain the restriction. A stale form submission shows an inline error and link to the existing kit. Account, public, and staff creation share the guard under a customer row lock; simultaneous different request IDs cannot bypass it. Retries with the same request ID remain idempotent.

Cancellation or inbound shipment permits another request, unless another legacy kit still awaits shipment. Existing duplicates are not cancelled automatically. Packing instructions remain on the kit detail and digital packet; the dashboard does not repeat them in a separate “Next steps” panel.

---

## Payment Methods & Flow

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                     PAYMENT PROCESSING                           │
  │                                                                  │
  │  Methods available:                                              │
  │    • Check      — mailed to customer's address                   │
  │    • ACH        — bank transfer to account on file               │
  │    • Zelle      — sent to phone/email on file                    │
  │    • PayPal     — sent to PayPal account on file                 │
  │    • Venmo      — sent to Venmo account on file                  │
  │                                                                  │
  │  Status flow:                                                    │
  │                                                                  │
  │    PENDING ──→ PROCESSING ──→ SENT ──→ COMPLETED                 │
  │                                 │                                │
  │                                 └──→ Kit becomes PAID            │
  │                                                                  │
  │  Failure path:                                                   │
  │    PENDING ──→ FAILED (admin retries the same payment obligation)   │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## Return Flow

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                      RETURN PROCESS                              │
  │                                                                  │
  │  Triggered: Automatically when customer declines offer           │
  │  Return number assigned: RET-YYYY-XXXXXX                         │
  │                                                                  │
  │    PENDING ──→ LABEL_CREATED ──→ IN_TRANSIT ──→ DELIVERED        │
  │                                                    │             │
  │                                                    └──→ Kit      │
  │                                                        becomes   │
  │                                                        RETURNED  │
  │                                                                  │
  │  Failure path:                                                   │
  │    Any state ──→ FAILED (admin investigates manually)            │
  │    Label can be voided and re-created if address is wrong        │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## Email Notifications Map

```
  CUSTOMER receives:                       ADMIN receives:
  ─────────────────                        ───────────────
  ① Kit created confirmation               ⑨ Offer accepted alert
  ② Magic login link                          ("process payment")
  ③ Physical kit shipped + tracking        ⑩ Offer declined alert
  ④ Items in transit + tracking               ("generate return label")
  ⑤ Items received at facility
  ⑥ Evaluation starts with the received notification
  ⑦ Offer ready ($amount, 7-day expiry)
  ⑧ Offer expired
  ⑪ Payment sent ($amount, method)
  ⑫ Return shipped + tracking
  ⑬ Return delivered
```

---

## All Test Scenarios

### Happy Paths

| # | Scenario | Kit Type | Final State |
|---|----------|----------|-------------|
| 1 | Standard accept flow | Physical | PAID |
| 2 | Standard accept flow | Digital | PAID |
| 3 | Standard decline flow | Physical | RETURNED |
| 4 | Standard decline flow | Digital | RETURNED |

### Offer Scenarios

| # | Scenario | Final State |
|---|----------|-------------|
| 5 | Offer expires → admin sends new offer → customer accepts | PAID |
| 6 | Offer expires → admin sends new offer → customer declines | RETURNED |
| 7 | Offer expires → cancellation rejected; admin must resolve offer/return | OFFER_SENT |
| 8 | Admin creates draft offer, adjusts, then sends final version | OFFER_SENT → ... |
| 9 | Multiple offers over time (expire → new → expire → new → accept) | PAID |

### Payment Scenarios

| # | Scenario | Payment Method |
|---|----------|---------------|
| 10 | Payment via check (with mailing tracking) | CHECK |
| 11 | Payment via ACH bank transfer | ACH |
| 12 | Payment via Zelle | ZELLE |
| 13 | Payment via PayPal | PAYPAL |
| 14 | Payment via Venmo | VENMO |
| 15 | Payment fails → admin retries with new payment | Any |

### Cancellation Scenarios

| # | Scenario | Expected Result |
|---|----------|----------------|
| 16 | Customer/admin cancel before inbound shipping | CANCELLED |
| 17 | Cancel after physical kit box shipped, before inbound items move | CANCELLED |
| 18 | Cancel while items are in transit | Rejected; remains SHIPPED |
| 19 | Cancel during evaluation | Rejected; remains EVALUATING |
| 20 | Cancel after offer sent | Rejected; remains OFFER_SENT |
| 21 | Cancel during return process | Rejected; remains DECLINED |

### Return Edge Cases

| # | Scenario |
|---|----------|
| 22 | FedEx delivery exception on return — admin investigates |
| 23 | Return label voided (wrong address) → new label created |
| 24 | Return shipment fails entirely — admin handles manually |

### Shipping Edge Cases

| # | Scenario |
|---|----------|
| 25 | FedEx address validation fails — admin corrects address |
| 26 | Customer changes kit type from Physical to Digital before labels exist |
| 27 | FedEx delivery exception on inbound shipment |
| 28 | Physical kit box delivered but customer never ships items back (stuck at SHIPPED) |

### Customer Account Scenarios

| # | Scenario |
|---|----------|
| 29 | Brand new customer — first kit ever |
| 30 | Returning customer — creates additional kit with existing account |
| 31 | Customer has multiple active kits simultaneously |
| 32 | Admin creates kit on behalf of walk-in customer |

### Data Integrity Scenarios

| # | Scenario |
|---|----------|
| 33 | Items edited after offer was sent — offer snapshot is stale |
| 34 | Customer updates address after kit created — kit snapshot unchanged |
| 35 | Kit deleted — all related records cascade-deleted |

---

## Current implementation and remaining product capabilities

The September 2026 remediation supersedes older scenario assumptions above. See [the complete finding and scenario matrix](dashboard-remediation-report.md).

- Offer expiry is checked at decision time. The scheduled sweep runs every six hours; the deadline is seven days after sending, even if the sweep has not yet run. Creating/sending/deciding offers serializes on the kit; prior drafts/sent offers are superseded.
- Digital Kit loading may create an eligible inbound FedEx label. A persistent reservation prevents concurrent purchases. Unknown carrier responses require staff reconciliation; saved responses can be recovered without another purchase. Void confirmation must finish before replacement. The packet requires a valid original PDF and preserves all carrier pages.
- Inbound IN_TRANSIT advances the kit to SHIPPED; inbound DELIVERED advances it to EVALUATING. Return delivery updates the return and kit RETURNED atomically on both manual and webhook paths. Duplicate/older events cannot undo delivery or cancellation.
- Payment retries reuse the unique payment record. Accepted amount/method/destination are immutable snapshots. SENT changes the kit to PAID; a failure reopens payment work on ACCEPTED. Customer messages distinguish sending from settlement.
- Cancellation is allowed only from PENDING or SHIPPED, before inbound items are travelling or received and after uncertain carrier creation is resolved. Unused labels are queued for cancellation; later callbacks cannot reopen the kit. Appraisal, accepted payments and returns must finish through their own workflows. Customers can cancel their own eligible kits with confirmation; staff use the same transition. Cancellation does not send a dedicated customer email.
- Customer profile edits do not rewrite kit snapshots. Before payout or return label preparation, the customer can explicitly apply their current shipping address. A prepared/shipped return or accepted payment protects its saved destination.
- Notification and carrier side effects use a durable retry queue; a successful domain mutation does not imply email/carrier completion. The notification cron requires CRON_SECRET.
- Insurance defaults to $1,000. The operator retained the existing bonus and turnaround wording. No automatic bonus eligibility system is claimed.

Remaining optional capabilities: refunds/reversals, image uploads, USPS purchasing integration, archival instead of hard deletion, operational retention tooling, and a dedicated cancellation notification. These require explicit product scope; no existing record was deleted during this audit.

### Nearby FedEx locations in digital kits

The printable digital kit displays up to four nearby staffed FedEx stores using its shipping-address snapshot (falling back to the customer's shipping address only when there is no snapshot). The shipping service retrieves locations alongside company settings. Store name, full address, and distance appear in a three-column table that fits mobile screens and remains in the printed/downloaded packet.

The lookup requests staffed location types and excludes self-service drop boxes, parcel lockers, and unknown types. FedEx documents location-type filtering in its [Locations Search API](https://developer.fedex.com/api/en-us/catalog/locations/v1/docs.html); the supported type identifiers are also listed in its [developer guide](https://www.fedex.com/us/developer/webhelp/ws/2022/Docs/FedEx_WebServices_DevelopersGuide_v2022_APAC.pdf). The location lookup has a five-second deadline covering both OAuth and the API request. If it fails, times out, or returns no staffed stores, the packet stays available with the existing staffed-location finder link.

Regression coverage: `tests/fedex-locations.test.ts` checks address forwarding, result mapping/limit, staffed filtering, empty/error fallback, and a stalled OAuth request. Browser checks used a disposable development kit: four staffed stores returned near Orlando; the table fit 375px and 1280px views; the letter with locations measured 720 × 909 CSS pixels, within the letter PDF content area; the print action completed. No real shipping labels were purchased or production records changed during verification.
