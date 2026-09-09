# Digital kit preparation

## Context
Customers who print or download their packet still see a demand to print it. Document actions are scattered above the preview, and a global refresh control distracts from the workflow.

## Decision
Record packet access against the current inbound label after Print is invoked, a complete PDF is generated, or the customer acknowledges an earlier print. Remove prepared kits from dashboard preparation alerts while retaining document access and packing/drop-off guidance. Group primary actions in one panel; expose the carrier-only file as a secondary option. Refresh account status automatically.

Customer dashboard and kit documents change. Admin carrier status and public pages keep their current behavior. Prior authorization covers fixing audit regressions and browser validation without additional approval stops.

## Alternatives
- Browser-only memory: loses progress across devices and can obscure replacement labels.
- Mark the kit shipped: confuses document preparation with actual carrier handoff.
- Infer old downloads: historical print/download events were never recorded.

## Consequences
A nullable label timestamp requires an additive migration. It records access, never confirmed physical printing. Old downloads cannot be reconstructed; customers can acknowledge their existing printed packet. Replacement labels start with no access record.

## Acceptance
Print and successful PDF generation clear the preparation reminder across navigation and reload. Failed generation does not. Repeat access is idempotent. Another customer, a voided label, and ineligible kits cannot be marked. Reprint and clear packing steps remain available. Controls fit at 375px and desktop; print output excludes all controls.
