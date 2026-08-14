# Collaboration clone reconcile (frontend)

Date: 2026-08-13
Branch: `feature/collab-clone-reconcile-fe`
Frozen source: clone commit `3951003` (`collaboration/frontend-production-reconciliation`)

## Source of truth

- Executable UI/runtime: frozen clone commit `3951003`
- Product semantics only: dummy_tcs
- Keep developer app-shell, routes, and Aurora primitives

## What landed

Checked out clone `src/features/collaboration/` onto the existing
`/brand/collaborations` and `/creator/collaborations` pages. Pages still only
compose `CollaborationWorkspace`.

Clone already uses Aurora `Button` / `TextField` / `Alert`, v2 `env.apiUrl`,
`authAuthorizationHeader`, and `commandId` + `expectedAggregateVersion`
envelopes. Feature-scoped `collaboration-workspace.css` is retained (prototype
layout port, documented here).

Removed leftover non-clone files:

- `utils/collaboration-execution-state.ts`
- `hooks/use-collaboration-live-sync.ts`

## Mobile

Desktop: persistent 3-pane shell (list / chat / execution).
Mobile: 3-step full-screen flow with Back + full-width CTAs (`fullWidthOnMobile`).

## FE/BE path cross-check

Prefix: `POST/GET ${apiUrl}/api/v1/collaboration`

| FE client | BE controller | Status |
| --- | --- | --- |
| `GET /threads` | `GET threads` | match |
| `GET /threads/:id` | `GET threads/:collaborationId` | match |
| `GET /threads/:id/messages` | `GET threads/:collaborationId/messages` | match |
| `POST /threads/:id/messages` | `POST threads/:collaborationId/messages` | match |
| `POST /creator/bank-details` | `POST creator/bank-details` | match |
| `negotiation/accept-proposed-fee` | same | match + envelope |
| `negotiation/counter-offer` | same | match; body `counterFee` |
| `negotiation/accept-counter-offer` | same | match + envelope |
| `negotiation/decline` | same | match + envelope |
| `securement/request-escrow-funding` | same | match + envelope |
| `fulfillment/provide` | same | match |
| `fulfillment/confirm` | same | match |
| `fulfillment/report-issue` | same | match |
| `fulfillment/remediate` | same | match |
| `production/submit-deliverable` | same | match |
| `production/approve-deliverable` | same | match |
| `production/request-revision` | same | match |
| `production/reject-final` | same | match |
| `publishing/authorize` | same | match |
| `publishing/decline` | same | match |
| `publishing/evidence` | same | match |
| `publishing/corrected-evidence` | same | match |
| `publishing/verify` | same | match |
| `publishing/request-correction` | same | match |
| `end-by-brand` | same | match |
| `cancel-by-creator` | same | client exists; hub does not render |
| `feedback/review` | same | match; body includes `collaborationId` |

BE-only legacy/compat routes not called by clone FE:

- `POST .../logistics/*`
- `POST .../production/submit`
- `POST .../production/review`
- `POST .../posting/live-url`
- `POST .../posting/verify-compliance`
- `GET /creator/profile`
- `POST /creator/shipping-address`

SYSTEM/admin-only (no FE HTTP): escrow confirm, settlement execution, admin
resolution, feedback reveal.

Realtime: FE `io(${socketUrl}/collaboration)` matches BE `@WebSocketGateway({ namespace: "/collaboration" })`.

## Out of scope

- Pause/resume UI
- Manual-payment command buttons (capability mapped, no clone client/UI)
- Creator cancel button (client exists, clone hub does not render it)
- Commit, PR, or deploy
