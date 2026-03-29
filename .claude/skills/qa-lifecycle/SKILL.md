---
name: qa-lifecycle
description: Multi-agent QA testing of the appraisal kit lifecycle. Opens two browser sessions side by side (customer + admin) and simulates real users coordinating through the entire flow, with a FedEx agent triggering shipping webhooks.
user-invocable: true
---

# QA Lifecycle Test — Multi-Agent Kit Lifecycle

You are an orchestrator running an end-to-end QA test of the Gold Geek appraisal kit lifecycle. You control three agents — a **Customer**, an **Admin**, and **FedEx** — each acting independently in their own browser session or via API calls. Your job is to coordinate them through the selected flow, switching between agents as needed, adapting to what each agent sees on screen.

---

## Step 1: Ask Which Scenario to Run

Present this menu and ask the user to pick a scenario:

**Happy Paths:**
| # | Scenario | Kit Type | Final State |
|---|----------|----------|-------------|
| 1 | Standard accept | Physical | PAID |
| 2 | Standard accept | Digital | PAID |
| 3 | Standard decline | Physical | RETURNED |
| 4 | Standard decline | Digital | RETURNED |

**Offer Scenarios:**
| # | Scenario | Final State |
|---|----------|-------------|
| 5 | Offer expires, admin sends new offer, customer accepts | PAID |
| 6 | Offer expires, admin sends new offer, customer declines | RETURNED |
| 7 | Offer expires, admin cancels kit | CANCELLED |

**Cancellation Scenarios:**
| # | Scenario | Cancelled From |
|---|----------|----------------|
| 16 | Cancel before any shipping | PENDING |
| 19 | Cancel during evaluation | EVALUATING |
| 20 | Cancel after offer sent | OFFER_SENT |

---

## Step 2: Setup (Automatic)

### Test Data
- **Admin email:** `admin@goldgeek.com`
- **Customer identity:** Generate a unique email using the current timestamp (e.g., `qa-{Date.now()}@test.com`) and name (e.g., "QA Test", "User {timestamp}")
- **Test address:** 123 Test Street, Austin, TX, 78701
- **Test items for evaluation:**
  - Item 1: 14K Gold Ring, 5.2g, 14K purity, $192.40
  - Item 2: 18K Gold Necklace, 8.5g, 18K purity, $403.75

### Browser Setup

Open two browser pages in **isolated contexts** (separate cookies/sessions):

1. **Customer browser:** `new_page` with `isolatedContext: "customer"` and `url: "about:blank"`
2. **Admin browser:** `new_page` with `isolatedContext: "admin"` and `url: "about:blank"`
3. **Size both for side-by-side viewing:** `resize_page` each to `width: 700, height: 900`
4. Record both page IDs — you'll use `select_page(pageId, bringToFront: true)` to switch between them throughout the test.

### Preflight Check

Verify the dev server is running:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
If it returns anything other than 200, **start the dev server yourself** by running `npm run dev` in the background (using `run_in_background: true`). Then poll every 3 seconds until `curl` returns 200 (up to 30 seconds). Do NOT ask the user to start it.

---

## Step 3: Execute the Flow

Run the phases below in the order dictated by the selected scenario. See the **Scenario-to-Phase Mapping** at the bottom for which phases apply to each scenario.

### How to Interact with Pages

**CRITICAL RULES:**
1. **Always `take_snapshot` before acting.** The snapshot gives you the a11y tree with element UIDs. Find elements by their visible text, role, or label — never assume selectors.
2. **Use `click(uid)` and `fill(uid, value)` with UIDs from the latest snapshot.** Use `fill_form` when filling multiple fields at once.
3. **If the page isn't what you expect, adapt.** Maybe there's a loading spinner, an error message, a redirect, or a confirmation dialog. Read the snapshot and figure out what happened.
4. **`take_screenshot` at milestones only** — after login, after kit creation, after shipping labels, after offer sent, after customer response, and at the final state. Use `take_snapshot` for everything else.
5. **After switching agents, always `select_page` with `bringToFront: true`** so the user can watch both browsers.
6. **Log progress** — output a brief line each time an agent completes a goal, e.g.:
   ```
   [CUSTOMER] Kit request submitted. Kit number: GG-2026-XXXXXX
   [ADMIN] Logged in to admin dashboard.
   [FEDEX] Sent INBOUND DELIVERED webhook for tracking XXXX.
   [ADMIN] Offer sent to customer. Total: $596.15
   ```

---

## Flow Phases

### Phase: Kit Request

**Who:** Customer Agent
**Goal:** Submit a new appraisal kit request via the public website.

**Context from lifecycle:**
> Customer provides name, email, phone, shipping address, kit type, optional notes and estimated value. Kit created in PENDING status. Kit number assigned (GG-YYYY-XXXXXX). Customer account created. Magic login link available.

**Instructions:**
- Switch to the Customer browser.
- Navigate to `http://localhost:3000/request-appraisal`.
- This is a **4-step wizard**. Fill each step and advance:
  - **Step 1 (Items):** Check at least one item category (e.g., "Fine Jewelry"), click Next.
  - **Step 2 (Description):** Describe the items, click Next.
  - **Step 3 (Contact):** Fill first name, last name, email (use generated email), phone. Click Next.
  - **Step 4 (Address):** Fill street, city, state, zip. Click the Submit button (labeled "Send").
- After submission, a success message appears. **In dev mode, a magic link is shown on the page** as a clickable link with text like "Click here to sign in". Extract its URL via `evaluate_script`:
  ```javascript
  () => document.querySelector('a[href*="/api/auth/verify"]')?.href
  ```
- **Important:** This form always creates a **DIGITAL** kit. For Physical kit scenarios, the customer will change the kit type after logging in.
- Store: `CUSTOMER_MAGIC_LINK`, `CUSTOMER_EMAIL`

**Done when:** Success message is visible and magic link URL is captured.

---

### Phase: Customer Login

**Who:** Customer Agent
**Goal:** Log in and access the customer dashboard.

**Instructions:**
- Navigate to the `CUSTOMER_MAGIC_LINK` URL.
- The session is established automatically. You'll land on the customer dashboard.
- Take a snapshot, find the kit card. Extract the kit ID from the kit link URL (the last path segment of a link like `/account/kit/{id}`).
- Store: `KIT_ID`
- `take_screenshot` — milestone: customer is logged in with new kit visible.

**Done when:** Dashboard loads showing the new kit.

---

### Phase: Kit Type Change (Physical scenarios only)

**Who:** Customer Agent
**Goal:** Change the kit type from Digital to Physical.

**Instructions:**
- Navigate to `/account/kit/{KIT_ID}`.
- Take a snapshot. Find the "Physical Kit" toggle button and click it.
- Verify the kit type now shows as Physical.

**Done when:** Kit detail page shows Physical kit type.

---

### Phase: Admin Login

**Who:** Admin Agent
**Goal:** Log in to the admin dashboard.

**Instructions:**
- Switch to the Admin browser.
- Navigate to `http://localhost:3000/admin/login`.
- Take a snapshot. Find the email input, fill it with `admin@goldgeek.com`.
- Click the submit button (labeled "Send Admin Magic Link").
- Wait for the success message. **In dev mode, a magic link appears as a clickable `<a>` tag** with text "Click here to login". Extract its URL:
  ```javascript
  () => document.querySelector('a[href*="/api/auth/verify"]')?.href
  ```
- Navigate to that URL. You'll land on the admin dashboard.
- `take_screenshot` — milestone: admin logged in.

**Done when:** Admin dashboard loads.

---

### Phase: Shipping Setup

**Who:** Admin Agent (Physical) or Admin + Customer (Digital)
**Goal:** Get shipping labels created and kit status to SHIPPED.

#### Physical Kit Flow

**Context from lifecycle:**
> Admin generates 2 FedEx labels: (1) Kit Delivery — company to customer, ships empty box. (2) Inbound — customer to company, prepaid return. Admin ships box. Kit status: SHIPPED.

**Instructions:**
- Navigate to `/admin/requests`. Find the new kit (look for the kit number or the most recent PENDING kit).
- Click into the kit detail page.
- Take a snapshot. Find and click "Generate FedEx Labels".
- Wait for success feedback. Take a snapshot to verify two labels appeared.
- **Extract tracking numbers** — take a snapshot and look for tracking number elements in the shipping labels section. You need both the KIT_DELIVERY and INBOUND tracking numbers. Use `evaluate_script` if needed to extract them from the page.
- Find and click the button to mark the kit as shipped (e.g., "Mark Shipped"). Confirm any dialog that appears.
- `take_screenshot` — milestone: kit SHIPPED with labels.
- Store: `KIT_DELIVERY_TRACKING`, `INBOUND_TRACKING`

#### Digital Kit Flow

**Context from lifecycle:**
> Admin generates 1 FedEx label: inbound (customer to company). Customer prints label from their dashboard, packs own box.

**Instructions:**
- Admin: Navigate to the kit in `/admin/requests`, open the detail page.
- Admin: Create the inbound shipping label (the page may have a button to generate it, or a manual label form where you fill in tracking details).
- **Extract the inbound tracking number.**
- Admin: Mark the kit as shipped if needed. Confirm any dialog.
- Customer Agent: Switch to Customer browser. Navigate to `/account/kit/{KIT_ID}/digital-kit` to view/print the digital kit (this simulates the customer seeing their shipping label).
- `take_screenshot` on the customer side — milestone: customer viewing their digital kit.
- Store: `INBOUND_TRACKING`

**Done when:** Kit status is SHIPPED and tracking number(s) are captured.

---

### Phase: FedEx Shipping Simulation

**Who:** FedEx Agent (Bash)
**Goal:** Simulate shipping events to get items delivered to Gold Geek, triggering automatic status transition to EVALUATING.

**Webhook endpoint:** `POST http://localhost:3000/api/webhooks/fedex`
**No signature required in dev mode.**

**Payload template:**
```json
{
  "event": "TRACKING_UPDATE",
  "trackingNumber": "{TRACKING_NUMBER}",
  "trackingInfo": {
    "trackingNumber": "{TRACKING_NUMBER}",
    "latestStatusDetail": {
      "code": "{EVENT_CODE}",
      "description": "{DESCRIPTION}"
    }
  }
}
```

Event codes: `IT` = In Transit, `DL` = Delivered.

#### Physical Kit Sequence
Send these webhooks in order, with `sleep 2` between each:
1. **KIT_DELIVERY IN_TRANSIT** — code `IT`, tracking = `KIT_DELIVERY_TRACKING`
2. **KIT_DELIVERY DELIVERED** — code `DL`, tracking = `KIT_DELIVERY_TRACKING` (box arrives at customer)
3. **INBOUND IN_TRANSIT** — code `IT`, tracking = `INBOUND_TRACKING` (customer ships items back)
4. **INBOUND DELIVERED** — code `DL`, tracking = `INBOUND_TRACKING` (items arrive at Gold Geek)

The last webhook auto-transitions the kit to **EVALUATING**.

#### Digital Kit Sequence
Send these webhooks in order, with `sleep 2` between each:
1. **INBOUND IN_TRANSIT** — code `IT`, tracking = `INBOUND_TRACKING`
2. **INBOUND DELIVERED** — code `DL`, tracking = `INBOUND_TRACKING`

The last webhook auto-transitions the kit to **EVALUATING**.

**Verification:** Switch to Admin browser, reload the kit detail page. Verify status shows "Evaluating".

**Done when:** Kit status is EVALUATING on the admin page.

---

### Phase: Item Evaluation

**Who:** Admin Agent
**Goal:** Add evaluated items to the kit.

**Context from lifecycle:**
> Admin inspects each item: identifies type (jewelry, coins, bullion, scrap, watches), tests metal type (gold, silver, platinum, palladium), weighs items, determines purity (10K, 14K, 18K, 22K, 24K, etc.), assigns appraised value to each item.

**Instructions:**
- On the admin kit detail page (status should be EVALUATING).
- Find and click the "Add Item" button (may be labeled "+ Add Item").
- Take a snapshot to see the item form. Fill in the fields for the first test item (description, metal type, weight, purity, appraised value). Submit.
- Wait for the item to appear in the list.
- Repeat for the second test item.
- Take a snapshot to verify both items are listed with their values.

**Done when:** At least 2 items are listed with appraised values.

---

### Phase: Offer Generation & Sending

**Who:** Admin Agent
**Goal:** Generate an offer and send it to the customer.

**Context from lifecycle:**
> Admin generates offer: total = sum of all appraised values. Item-by-item breakdown included. Offer number assigned. 7-day expiration set. Admin sends offer. Kit status: OFFER_SENT.

**Instructions:**
- On the kit detail page, find "Generate Offer" button and click it.
- A confirmation dialog will appear showing the item count and total value. Confirm it.
- Wait for the offer to appear (status: DRAFT).
- Find "Send Offer to Customer" (or similar) and click it.
- A confirmation dialog will warn about the 7-day expiration. Confirm it.
- Wait for status to change to OFFER_SENT.
- `take_screenshot` — milestone: offer sent.

**Done when:** Kit status is OFFER_SENT.

---

### Phase: Customer Accepts Offer

**Who:** Customer Agent
**Goal:** Accept the offer and select a payment method.

**Context from lifecycle:**
> Customer selects payment method: Check, ACH, Zelle, PayPal, Venmo. Customer confirms acceptance. Kit status: ACCEPTED.

**Instructions:**
- Switch to Customer browser. Navigate to `/account/kit/{KIT_ID}`.
- Take a snapshot. You should see an offer banner with the amount and an "Accept Offer" button/link.
- Click "Accept Offer". This navigates to the accept page.
- Take a snapshot on the accept page. You'll see payment method options and a confirm button.
- Select a payment method if needed (the default is fine).
- Click the confirm button (labeled something like "Confirm & Accept").
- Wait for redirect back to the kit detail page with a success indicator.
- `take_screenshot` — milestone: offer accepted.

**Done when:** Kit status shows ACCEPTED.

---

### Phase: Customer Declines Offer

**Who:** Customer Agent
**Goal:** Decline the offer (triggers automatic return creation).

**Context from lifecycle:**
> Customer confirms decline (irreversible). Return automatically created. Kit status: DECLINED.

**Instructions:**
- Switch to Customer browser. Navigate to `/account/kit/{KIT_ID}`.
- Take a snapshot. Find the "Decline" button/link.
- Click it. This navigates to the decline confirmation page.
- Take a snapshot. You'll see a warning that this is irreversible.
- Click the decline confirmation button (labeled something like "Decline & Return Items").
- Wait for redirect back to the kit detail page.
- `take_screenshot` — milestone: offer declined.

**Done when:** Kit status shows DECLINED.

---

### Phase: Payment Processing

**Who:** Admin Agent
**Goal:** Process the payment through all stages until the kit is PAID.

**Context from lifecycle:**
> Payment status flow: PENDING -> PROCESSING -> SENT -> COMPLETED. When payment is marked SENT, kit becomes PAID. Customer is notified.

**Instructions:**
- Switch to Admin browser. Reload the kit detail page.
- Take a snapshot. The kit should be in ACCEPTED status with a payment section visible.
- Find and click "Process Payment". A dialog may ask for payment method — confirm it.
- The payment is created. Now advance it through each status:
  - Find "Mark Processing" — click it, confirm any dialog.
  - Find "Mark Sent" — click it, confirm (this triggers customer notification and marks kit PAID).
  - Find "Mark Completed" — click it, confirm.
- `take_screenshot` — milestone: kit PAID, payment COMPLETED.

**Done when:** Kit status is PAID.

---

### Phase: Return Processing

**Who:** Admin Agent + FedEx Agent
**Goal:** Generate a return label and ship items back to the customer.

**Context from lifecycle:**
> Admin generates return FedEx label (company to customer). Admin ships items back. Items delivered to customer. Kit status: RETURNED.

**Instructions:**
- Switch to Admin browser. Reload the kit detail page.
- Kit should be in DECLINED status with a return section visible.
- Find and click "Generate Return FedEx Label" (or similar button to create a return label).
- Wait for label creation. Extract the return tracking number from the page.
- Store: `RETURN_TRACKING`

**FedEx Agent (Bash):**
- Send RETURN IN_TRANSIT webhook (code `IT`, tracking = `RETURN_TRACKING`). Sleep 2 seconds.
- Send RETURN DELIVERED webhook (code `DL`, tracking = `RETURN_TRACKING`).

**Verification:** Reload the admin kit detail page. Status should be RETURNED.
- `take_screenshot` — milestone: kit RETURNED.

**Done when:** Kit status is RETURNED.

---

### Phase: Cancellation

**Who:** Admin Agent
**Goal:** Cancel the kit.

**Context from lifecycle:**
> WHO: Admin only. WHEN: Any state. Kit status: CANCELLED. No automatic email.

**Instructions:**
- Switch to Admin browser. Navigate to the kit detail page.
- Find "Cancel Kit" button and click it.
- A danger confirmation dialog will appear. Confirm the cancellation.
- Wait for status to change to CANCELLED.
- Switch to Customer browser. Navigate to `/account/kit/{KIT_ID}`. Verify the customer sees the kit as CANCELLED.
- `take_screenshot` on both browsers — milestone: CANCELLED.

**Done when:** Both dashboards show CANCELLED.

---

### Phase: Offer Expiration (Scenarios 5, 6, 7)

**Who:** Orchestrator (Bash)
**Goal:** Fast-forward the offer expiration so we can test the re-offer or cancellation flow.

**Instructions:**
After the offer has been sent (Phase: Offer Generation & Sending), expire it:

```bash
# Find the kit's ID in the database and expire the active offer
npx prisma db execute --stdin <<< "UPDATE \"Offer\" SET \"expiresAt\" = NOW() - INTERVAL '1 day' WHERE \"kitId\" = '{KIT_ID}' AND \"status\" = 'SENT';"
```

Then trigger the expiration cron:
```bash
curl -s http://localhost:3000/api/cron/expire-offers
```

**Verification:**
- Reload both browser pages. The offer should now show as expired.
- On the admin side, the admin can now generate a **new** offer.

**Then:**
- For scenario 5: Admin generates and sends a new offer (repeat Item Evaluation + Offer phases), then Customer accepts -> Payment -> PAID.
- For scenario 6: Same, but Customer declines -> Return -> RETURNED.
- For scenario 7: Admin cancels the kit -> CANCELLED.

---

### Phase: Final Verification

**Who:** Both agents
**Goal:** Confirm the test passed.

**Instructions:**
1. Switch to Customer browser. Navigate to `/account/kit/{KIT_ID}`. Take a screenshot.
2. Switch to Admin browser. Navigate to the kit detail page. Take a screenshot.
3. On both pages, use `evaluate_script` or read the snapshot to extract the current kit status text.
4. Compare the actual status against the expected final state from the scenario.
5. Output the result:

```
============================================
  QA LIFECYCLE TEST RESULT
============================================
  Scenario:  #{number} — {description}
  Kit Type:  {Physical|Digital}
  Kit ID:    {KIT_ID}
  Expected:  {expected final state}
  Actual:    {actual status from page}
  Result:    {PASS or FAIL}
============================================
```

If FAIL, describe what went wrong and at which phase.

---

## Scenario-to-Phase Mapping

Use this table to determine which phases to execute for each scenario:

| Scenario | Phases (in order) |
|----------|-------------------|
| **1** Physical Accept | Kit Request -> Customer Login -> Kit Type Change -> Admin Login -> Shipping Setup (Physical) -> FedEx Sim (Physical) -> Item Evaluation -> Offer -> Customer Accepts -> Payment -> Final Verification (expect PAID) |
| **2** Digital Accept | Kit Request -> Customer Login -> Admin Login -> Shipping Setup (Digital) -> FedEx Sim (Digital) -> Item Evaluation -> Offer -> Customer Accepts -> Payment -> Final Verification (expect PAID) |
| **3** Physical Decline | Kit Request -> Customer Login -> Kit Type Change -> Admin Login -> Shipping Setup (Physical) -> FedEx Sim (Physical) -> Item Evaluation -> Offer -> Customer Declines -> Return Processing -> Final Verification (expect RETURNED) |
| **4** Digital Decline | Kit Request -> Customer Login -> Admin Login -> Shipping Setup (Digital) -> FedEx Sim (Digital) -> Item Evaluation -> Offer -> Customer Declines -> Return Processing -> Final Verification (expect RETURNED) |
| **5** Expire + Accept | Same as 1 or 2 through Offer -> Offer Expiration -> Item Evaluation (new) -> Offer (new) -> Customer Accepts -> Payment -> Final Verification (expect PAID) |
| **6** Expire + Decline | Same through Offer -> Offer Expiration -> Item Evaluation (new) -> Offer (new) -> Customer Declines -> Return Processing -> Final Verification (expect RETURNED) |
| **7** Expire + Cancel | Same through Offer -> Offer Expiration -> Cancellation -> Final Verification (expect CANCELLED) |
| **16** Cancel PENDING | Kit Request -> Customer Login -> Admin Login -> Cancellation -> Final Verification (expect CANCELLED) |
| **19** Cancel EVALUATING | Same as 1 or 2 through FedEx Sim -> Cancellation -> Final Verification (expect CANCELLED) |
| **20** Cancel OFFER_SENT | Same through Offer -> Cancellation -> Final Verification (expect CANCELLED) |

---

## Lifecycle Reference

This is the complete kit status workflow for your reference:

```
PENDING -> SHIPPED -> EVALUATING -> OFFER_SENT
                                        |
                                ACCEPTED -> PAID
                                DECLINED -> RETURNED
                                (CANCELLED from any state)
```

**Physical Kit shipping sequence:**
1. Admin generates KIT_DELIVERY + INBOUND labels
2. Admin marks kit SHIPPED
3. FedEx: KIT_DELIVERY goes IN_TRANSIT, then DELIVERED (box arrives at customer)
4. FedEx: INBOUND goes IN_TRANSIT (customer ships items), then DELIVERED (items arrive -> auto-EVALUATING)

**Digital Kit shipping sequence:**
1. Admin generates INBOUND label
2. Customer views/prints digital kit from dashboard
3. Admin marks kit SHIPPED (or it happens automatically)
4. FedEx: INBOUND goes IN_TRANSIT, then DELIVERED (items arrive -> auto-EVALUATING)

**Payment flow:** PENDING -> PROCESSING -> SENT (kit becomes PAID) -> COMPLETED

**Return flow:** PENDING -> LABEL_CREATED -> IN_TRANSIT -> DELIVERED (kit becomes RETURNED)

---

## Error Handling

- **If a page shows an error message:** Read the snapshot, report the error, and ask the user whether to retry or abort.
- **If a status doesn't match expectations:** Stop, take a screenshot on both browsers, report the discrepancy with the phase name and expected vs actual status.
- **If an element can't be found:** Take a snapshot, look carefully at the full a11y tree. The element may have a different label than expected. If truly not present, the page may be in a different state — investigate before giving up.
- **If a webhook returns an error:** Report the HTTP status and response body. Check that the tracking number is correct.
- **Never proceed past a failed verification.** Always stop and report.
