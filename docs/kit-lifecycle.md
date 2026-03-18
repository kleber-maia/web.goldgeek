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
               ▼                           │
        ┌────────────┐                     │
        │  KIT_SENT  │                     │
        └──────┬─────┘                     │
               │                           │
               └─────────────┬─────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Customer ships      │
                  │ items to company    │
                  └──────────┬──────────┘
                             │
                             ▼
                      ┌────────────┐
                      │ IN_TRANSIT │
                      └──────┬─────┘
                             │
                             ▼
                      ┌────────────┐
                      │  RECEIVED  │
                      └──────┬─────┘
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

         ★ CANCELLED can happen from ANY state ★
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
  │  Admin ships box  ──→  Kit status: KIT_SENT                      │
  │                        EMAIL → Customer: "Kit is on its way"     │
  │                                                                  │
  │  Customer receives box, packs items, ships back using ②          │
  │                                                                  │
  │  Items in transit ──→  Kit status: IN_TRANSIT                    │
  │                        EMAIL → Customer: "Package in transit"    │
  │                                                                  │
  │  Items arrive     ──→  Kit status: RECEIVED                      │
  │                        EMAIL → Customer: "We received your kit"  │
  └──────────────────────────────────────────────────────────────────┘

  ┌────────────────────────── DIGITAL KIT ───────────────────────────┐
  │                                                                  │
  │  Admin generates 1 FedEx label:                                  │
  │    ① Inbound label (customer → company)                          │
  │                                                                  │
  │  Customer prints label from their dashboard, packs own box       │
  │                                                                  │
  │  Items in transit ──→  Kit status: IN_TRANSIT                    │
  │                        EMAIL → Customer: "Package in transit"    │
  │                                                                  │
  │  Items arrive     ──→  Kit status: RECEIVED                      │
  │                        EMAIL → Customer: "We received your kit"  │
  └──────────────────────────────────────────────────────────────────┘
```

### Phase 3: Evaluation & Offer

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  Admin starts evaluation  ──→  Kit status: EVALUATING            │
  │                                EMAIL → Customer: "Evaluation     │
  │                                started"                          │
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
  │    → Or admin can cancel the kit                                 │
  │    → Or customer contacts support to negotiate                   │
  │                                                                  │
  │  NON-TERMINAL: Awaiting admin/customer action                    │
  └──────────────────────────────────────────────────────────────────┘
```

### Cancellation (from any state)

```
  ┌──────────────────── CANCELLATION ───────────────────────────────┐
  │                                                                  │
  │  WHO: Admin only                                                 │
  │  WHEN: Any state (PENDING through DECLINED)                      │
  │                                                                  │
  │  → Kit status: CANCELLED                                         │
  │  → No automatic email (admin communicates manually)              │
  │  → No automatic cleanup of in-flight offers, payments, returns   │
  │                                                                  │
  │  TERMINAL STATE: CANCELLED                                       │
  └──────────────────────────────────────────────────────────────────┘
```

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
  │    PENDING ──→ FAILED (admin must create new payment manually)   │
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
  ⑥ Evaluation started
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
| 7 | Offer expires → admin cancels kit | CANCELLED |
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

| # | Scenario | Cancelled From |
|---|----------|----------------|
| 16 | Cancel before any shipping | PENDING |
| 17 | Cancel after kit box shipped (physical) | KIT_SENT |
| 18 | Cancel while items are in transit | IN_TRANSIT |
| 19 | Cancel during evaluation | EVALUATING |
| 20 | Cancel after offer sent (customer hasn't responded) | OFFER_SENT |
| 21 | Cancel during return process | DECLINED |

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
| 28 | Physical kit box delivered but customer never ships items back (stuck at KIT_SENT) |

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

## Known Gaps

1. **Offer expiration is not automated** — requires manual trigger or external scheduler
2. **No constraint preventing multiple active offers** for the same kit
3. **No refund/reversal flow** after a kit reaches PAID
4. **No image upload** — item images field exists but has no upload mechanism
5. **Cancellation sends no email** — customer must be notified out-of-band
6. **USPS has no API integration** — only FedEx labels can be auto-generated
7. **No soft delete** — deleting a kit destroys entire audit trail permanently
