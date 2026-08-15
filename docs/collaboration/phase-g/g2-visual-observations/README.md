# Collaboration G2 Visual Observation Pack

Captured from the accepted local G1 runtime on 2026-08-15.

These screenshots are evidence inputs for G2 visual/UX freeze. They do not
authorize Stitch to change lifecycle, financial, bank, messaging, fulfillment,
counterpart-data, or settlement ownership.

The screenshot inventory and observations are recorded in section 22 of
`../10_g1_consolidated_local_functional_acceptance.md`.

## Screenshot inventory

1. `01_creator_cancelled_terminal.png` — Creator desktop terminal state:
   CANCELLED row, closed messaging/history retention, financial resolution.
2. `02_creator_active_negotiation.png` — Creator desktop ACTIVE Negotiation:
   inbox, chat/composer, waiting-for-Brand execution summary.
3. `03_creator_brand_context_drawer.png` — Creator view of Brand counterpart
   context (campaign, asset, brief).
4. `04_creator_mobile_inbox.png` — 390 × 844 Creator inbox and four-slot bottom
   navigation.
5. `05_creator_mobile_chat.png` — Creator mobile Chat step with Back, execution
   hub transition, history, and composer.
6. `06_brand_negotiation_actions.png` — Brand desktop Negotiation actions:
   accept, one counter-offer, decline.
7. `07_brand_creator_context_drawer.png` — Brand view of Creator counterpart
   context (handle, campaign, asset, brief).
8. `08_brand_securement_funding.png` — Brand Securement state with agreed fee,
   reserve decomposition, and Fund collaboration CTA.
9. `09_creator_securement_cancel.png` — Creator Securement state with
   capability-gated Cancel collaboration action.

## G2 observation boundary

- The current information hierarchy is functionally usable but visually dense
  in the execution cards.
- Desktop preserves the frozen inbox / chat / execution three-pane composition.
- Mobile preserves the frozen Inbox → Chat → Execution progression and required
  bottom navigation.
- Drawers expose only the accepted MVP counterpart fields.
- The degraded-realtime banner is operational evidence, not a visual redesign
  requirement.
- G2 may refine Aurora hierarchy, spacing, typography, density, responsive
  composition, and loading/empty/error visuals. It must not invent or alter
  backend-owned actions or lifecycle semantics.
