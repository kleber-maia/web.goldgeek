# Appraisal kit lifecycle

This document is the product specification for appraisal kits. It defines the customer-facing flow and status wording for both kit types.

## Digital Kit

Digital Kit is the default. The customer uses their own packaging. Its PDF contains the customer documents and a prepaid air label from the customer to Gold Geek.

| Step | Event | Customer-facing status |
|---|---|---|
| 1 | Kit requested | **Waiting to be issued** |
| 2 | Customer or admin issues the PDF | **Waiting for Customer to pack and ship** |
| 3 | Customer ships or drops off the package | **In transit to Gold Geek** |
| 4 | Package is delivered to Gold Geek | **Waiting for appraisal** |
| 5 | Appraisal is completed and the offer is sent | **Offer sent** |
| 6A | Customer accepts the offer | **Waiting for payment** |
| 6B | Customer rejects the offer | **Waiting for return to customer** |
| 7B | Gold Geek ships the rejected items back | **In transit back to customer** |
| 8B | The return is delivered | **Returned** |

After an accepted offer is paid, the terminal status is **Paid**.

## Physical Kit

Gold Geek sends the customer an empty physical kit. The kit contains a prepaid air label for shipping the customer's items back to Gold Geek.

The admin issues two labels:

- A ground label from Gold Geek to the customer for the empty kit.
- An air label from the customer to Gold Geek for the packed items.

| Step | Event | Customer-facing status |
|---|---|---|
| 1 | Kit requested | **Waiting to be shipped** |
| 2 | Admin issues both labels | **Waiting to be shipped** |
| 3 | Gold Geek ships the empty kit | **In transit to Customer** |
| 4 | The empty kit is delivered to the customer | **Waiting for Customer to pack and ship** |
| 5 | Customer ships or drops off the packed kit | **In transit to Gold Geek** |
| 6 | Package is delivered to Gold Geek | **Waiting for appraisal** |
| 7 | Appraisal is completed and the offer is sent | **Offer sent** |
| 8A | Customer accepts the offer | **Waiting for payment** |
| 8B | Customer rejects the offer | **Waiting for return to customer** |
| 9B | Gold Geek ships the rejected items back | **In transit back to customer** |
| 10B | The return is delivered | **Returned** |

After an accepted offer is paid, the terminal status is **Paid**.

## Shared rules

- Status changes happen only after the stated event. Creating a request is not issuing a PDF or label; issuing a PDF or label is not shipping; printing is not a carrier drop-off.
- Carrier pickup or the first in-transit scan confirms that a package was shipped. Carrier delivery confirms arrival.
- The seven-day offer response period begins when the offer is sent. An expired offer is no longer actionable; the customer remains at **Offer sent** until staff sends a replacement or resolves the kit.
- Supported payment methods are Check, ACH, Zelle, PayPal, and Venmo.
- Rejecting an offer creates the return workflow. Gold Geek pays for the return shipment.
- Cancellation is allowed only before the customer ships their items to Gold Geek. A cancelled kit has the terminal status **Cancelled**.
- Every kit keeps the shipping address captured for that kit. Updating the customer's profile does not silently change an existing kit, payment, or return destination.
- Customer and admin views must describe the same underlying event, even when the interfaces use different layouts.
- Every status change must appear in the kit activity timeline. Customer notifications are sent for meaningful shipping, offer, payment, and return events.
