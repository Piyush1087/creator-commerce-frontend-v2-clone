# Collaboration Phase G — G2.1 Surface & Ownership Freeze

**Status:** ACCEPTED  
**Captured:** 2026-08-15  
**Scope:** G2.1 ONLY — documentation freeze; no Stitch; no visual redesign implementation; no merge; no deploy  
**Inputs:** Autonomous playbook; `05_g0_3_authority_freeze_g1_plan.md`; `10_g1_consolidated_local_functional_acceptance.md`; G1A–G1C acceptance records  
**Operator override:** Stop before G3 Stitch even if later G2 gates AUTO-PROCEED toward G3.

---

## 1. Purpose

Freeze the final Collaboration surface map and ownership model so G2.2–G2.5 and later Stitch (G3) cannot invent lifecycle, module ownership, financial policy, or Intelligence logic.

This freeze restates accepted G0.3 / G1 authority. It does not reopen Product policy.

---

## 2. Global ownership rules (carried)

| Rule | Freeze |
|---|---|
| HTTP authority | Persisted Collaboration HTTP is source of truth; realtime is invalidate-and-refetch only |
| Capability authority | FE consumes `availableActions`; does not re-encode lifecycle allow-lists |
| Brand route | `/brand/collaborations` operational |
| Creator route | `/creator/collaborations` operational |
| `/brand/collaboration-page` | Preview only — not operational Collaboration |
| Admin / unknown | Not operational Collab actors; never default to Brand |
| Creator bank | Settings/Payout owns write; Collaboration links / consumes readiness only |
| Settlement money movement | Payout/Escrow deferred adapter; Collab owns entitlement/projection only |
| Fulfillment taxonomy | Not invented; description-first MVP |
| Counterpart history / Intelligence | Deferred owners — not Collab MVP drawers |

---

## 3. Surface freeze matrix

For each surface: Purpose · Canonical owner · Read authority · Mutation authority · Capability authority · Brand/Creator applicability · Belongs here · Belongs elsewhere · Deferred.

### 3.1 Collaboration Inbox / List

| Dimension | Freeze |
|---|---|
| Purpose | List actor-owned Collaborations; select thread |
| Canonical owner | Collaboration list/query projection |
| Read authority | `GET` threads scoped by Brand/Creator identity |
| Mutation authority | Selection / search / filter only — no lifecycle commands |
| Capability authority | N/A (read) |
| Brand / Creator | Both; Admin never |
| Belongs here | Counterpart identity, Campaign, Asset, Brief labels; lifecycle badge; unread/activity signals already projected |
| Belongs elsewhere | Campaign Applications pipeline; Intelligence rankings; appliedAt (not authorized) |
| Deferred | Pagination beyond current cap; appliedAt |

### 3.2 Collaboration Workspace

| Dimension | Freeze |
|---|---|
| Purpose | Compose Inbox + Chat + Execution Hub for one selected Collaboration |
| Canonical owner | Collaboration FE feature module |
| Read authority | List + detail + messages HTTP |
| Mutation authority | Only via child surfaces |
| Capability authority | Aggregates child `availableActions` |
| Brand / Creator | Role-gated mount; opposite-role redirect |
| Belongs here | Pane composition, degraded-realtime notice, Manual Refresh |
| Belongs elsewhere | App-wide settings, payout bank forms, Campaign planner |
| Deferred | G2 visual composition only (this package freezes ownership, not pixels) |

### 3.3 Collaboration Header / Summary

| Dimension | Freeze |
|---|---|
| Purpose | Identify selected Collaboration and open light counterpart context |
| Canonical owner | Collaboration detail projection |
| Read authority | Detail identity + commercial/lifecycle summary fields already on detail |
| Mutation authority | Open counterpart drawer; no independent lifecycle writes |
| Capability authority | N/A |
| Brand / Creator | Both |
| Belongs here | Counterpart display name/handle, Campaign/Asset/Brief shorthand, lifecycle/status |
| Belongs elsewhere | Full execution cards; bank forms; relationship history |
| Deferred | Richer header commercial strip beyond existing projection |

### 3.4 Chat / Messages

| Dimension | Freeze |
|---|---|
| Purpose | Conversation history + send when allowed |
| Canonical owner | Collaboration messaging |
| Read authority | Messages GET; history always when thread loaded |
| Mutation authority | `POST …/messages` only |
| Capability authority | `PostCollaborationMessage` |
| Brand / Creator | Both |
| Belongs here | History, composer, send busy/fail, read-only closed messaging copy |
| Belongs elsewhere | Execution commands; feedback submit |
| Deferred | Pause command surface |

**Frozen read-only copy:** Messaging is closed for this collaboration. You can still view the conversation history.

### 3.5 Counterpart Context

| Dimension | Freeze |
|---|---|
| Purpose | Light MVP identity / source context drawer or sheet |
| Canonical owner | Collaboration detail compose |
| Read authority | Existing detail identity + `sourceContext` only |
| Mutation authority | None |
| Capability authority | N/A |
| Brand / Creator | Brand→Creator: name, handle, Campaign, Asset, Brief. Creator→Brand: Brand name, Campaign, Asset, Brief |
| Belongs here | MVP fields above; omit missing without fabricating |
| Belongs elsewhere | Trust scores, Intelligence, cross-campaign history, media-kit multi-fetch as workspace context, debug endpoint copy |
| Deferred | Brand-scoped relationship-history / richer Intelligence |

### 3.6 Negotiation

| Dimension | Freeze |
|---|---|
| Purpose | Fee negotiation / one Brand counter |
| Canonical owner | Collaboration commercial / negotiation commands |
| Read authority | Detail commercial + actions |
| Mutation authority | Accept / counter / decline commands |
| Capability authority | Negotiation actions in `availableActions` |
| Brand / Creator | Per projected action |
| Belongs here | Proposed/agreed fee presentation; capability-gated CTAs |
| Belongs elsewhere | Escrow funding UI (Securement); bank capture (Settings) |
| Deferred | Multi-round negotiation beyond frozen one-counter MVP |

### 3.7 Securement

| Dimension | Freeze |
|---|---|
| Purpose | Escrow / zero-cash / payout-details prerequisite |
| Canonical owner | Collaboration securement + Escrow/Payout readiness consumers |
| Read authority | Detail securement projection |
| Mutation authority | Funding / confirm commands; **not** bank write |
| Capability authority | Securement actions |
| Brand / Creator | Brand funding; Creator readiness / cancel when projected |
| Belongs here | Amount to secure, reserve decomposition when projected, Fund CTA when capable, link to Settings/Payout for bank |
| Belongs elsewhere | Creator bank form fields; Razorpay production ops |
| Deferred | Live Razorpay / production money movement |

### 3.8 Fulfillment

| Dimension | Freeze |
|---|---|
| Purpose | Brand support provide / confirm / issue / remediate |
| Canonical owner | Collaboration Fulfillment |
| Read authority | Locked snapshot + fulfillment state / history |
| Mutation authority | Provide / confirm / report-issue / remediate |
| Capability authority | Fulfillment actions |
| Brand / Creator | Per action |
| Belongs here | Description-first issue reporting; sequence remediation; opaque transport `issueCode` only if retained |
| Belongs elsewhere | User-facing issue taxonomy; legacy logistics enums on canonical rows |
| Deferred | Product-defined taxonomy (explicit Product decision required later) |

### 3.9 Production

| Dimension | Freeze |
|---|---|
| Purpose | Per-Deliverable submit / review / revision |
| Canonical owner | Collaboration Production |
| Read authority | Deliverable executions + versions |
| Mutation authority | Submit / approve / revision / final reject |
| Capability authority | Deliverable actions |
| Brand / Creator | Per action |
| Belongs here | Deliverable cards, version history presentation, capability CTAs |
| Belongs elsewhere | Auto-approval scheduler runtime; publishing authorize |
| Deferred | 72h auto-approval scheduler |

### 3.10 Publishing

| Dimension | Freeze |
|---|---|
| Purpose | Per-Deliverable authorize / evidence / verify when required |
| Canonical owner | Collaboration Publishing |
| Read authority | Publishing execution + strict `publishingRequired` boolean |
| Mutation authority | Authorize / decline / evidence / verify / correction |
| Capability authority | Publishing actions |
| Brand / Creator | Per action |
| Belongs here | Required vs not-required honesty; never coerce missing bool → false |
| Belongs elsewhere | Live social verification provider internals |
| Deferred | Live social verification provider |

### 3.11 Compliance

| Dimension | Freeze |
|---|---|
| Purpose | Separate correction path from Production revision |
| Canonical owner | Collaboration Publishing / compliance projection |
| Read authority | Detail compliance projection |
| Mutation authority | Correction commands |
| Capability authority | Related publishing/compliance actions |
| Brand / Creator | Per action |
| Belongs here | Compliance correction UI when projected |
| Belongs elsewhere | Production revision loop |
| Deferred | Provider-backed verification depth |

### 3.12 Resolution

| Dimension | Freeze |
|---|---|
| Purpose | Cancelled / Terminated reason + stage visibility |
| Canonical owner | Collaboration exception / resolution projection |
| Read authority | Detail resolution |
| Mutation authority | End / cancel commands when capable |
| Capability authority | Exception actions including Creator cancel |
| Brand / Creator | Brand end; Creator cancel when projected |
| Belongs here | Terminal reason, financial resolution summary when projected |
| Belongs elsewhere | Settlement money movement execution |
| Deferred | Pause/resume command surface |

### 3.13 Settlement

| Dimension | Freeze |
|---|---|
| Purpose | Entitlement / settlement state projection |
| Canonical owner | Collaboration entitlement; Payout/Escrow money movement |
| Read authority | Settlement projection on detail |
| Mutation authority | ConfirmSettlement only when adapter exists and action projected |
| Capability authority | Settlement actions when projected |
| Brand / Creator | As projected |
| Belongs here | Eligible ≠ paid honesty; pending/blocked/unavailable states |
| Belongs elsewhere | Tranche arithmetic invention; adapter implementation |
| Deferred | **COL-G0-022 settlement execution adapter** |

### 3.14 Completion

| Dimension | Freeze |
|---|---|
| Purpose | Completed lifecycle presentation |
| Canonical owner | Collaboration lifecycle |
| Read authority | Detail lifecycle |
| Mutation authority | Feedback only if capability present — not messaging |
| Capability authority | Feedback actions; messaging closed |
| Brand / Creator | Both |
| Belongs here | Completed panel; closed messaging copy in chat |
| Belongs elsewhere | Re-open negotiation / fake send |
| Deferred | None for MVP presentation |

### 3.15 Feedback

| Dimension | Freeze |
|---|---|
| Purpose | Post-completion double-blind feedback |
| Canonical owner | Collaboration feedback |
| Read authority | Feedback window + rows |
| Mutation authority | SubmitCollaborationFeedback |
| Capability authority | Feedback action |
| Brand / Creator | Both |
| Belongs here | Feedback form when window open; hidden until reveal rules |
| Belongs elsewhere | Public ratings outside Collab |
| Deferred | Reveal scheduler runtime |

### 3.16 Creator Cancellation

| Dimension | Freeze |
|---|---|
| Purpose | Creator cancel when capability projected |
| Canonical owner | Collaboration exception |
| Read authority | `CancelCollaborationByCreator` in `availableActions` |
| Mutation authority | `POST …/cancel-by-creator` |
| Capability authority | `CancelCollaborationByCreator` |
| Brand / Creator | Creator only |
| Belongs here | Confirmable cancel control in execution hub when capable |
| Belongs elsewhere | Always-visible cancel inventing policy |
| Deferred | None |

### 3.17 Realtime-Degraded State

| Dimension | Freeze |
|---|---|
| Purpose | Survive socket loss without losing HTTP authority |
| Canonical owner | FE realtime hook + HTTP |
| Read authority | HTTP always |
| Mutation authority | Commands still via HTTP |
| Capability authority | Unchanged by socket state |
| Brand / Creator | Both |
| Belongs here | Degraded notice; Manual Refresh; reconnect → authoritative refetch |
| Belongs elsewhere | Fallback polling; socket payloads as workflow truth |
| Deferred | Polling (explicitly out) |

### 3.18 Legacy Compatibility

| Dimension | Freeze |
|---|---|
| Purpose | Bound pre-foundation Collaborations |
| Canonical owner | BE `projectionSource` + FE presentation |
| Read authority | LEGACY_COMPATIBILITY mapper |
| Mutation authority | Only truthful projected actions — no silent canonical per-Deliverable controls |
| Capability authority | Projected only |
| Brand / Creator | Both |
| Belongs here | Limited-details Product copy; history/context may remain |
| Belongs elsewhere | User-facing “legacy”, `sourceApplicationId`, `projectionSource`, debug metadata |
| Deferred | Migration removal date (do not invent) |

**Frozen limited-details copy:** Headline *Limited collaboration details* · Body *Some details and actions are unavailable because this collaboration was created using an earlier workflow.*

### 3.19 Mobile Navigation

| Dimension | Freeze |
|---|---|
| Purpose | Reach operational Collaborations on mobile |
| Canonical owner | App shell |
| Read authority | N/A |
| Mutation authority | Navigation only |
| Capability authority | N/A |
| Brand / Creator | Creator four-slot: **Home · Campaigns · Collaborations · Profile**. Brand shell retains its Chat/Collaborations access patterns already accepted |
| Belongs here | Collaborations label in Creator bottom nav |
| Belongs elsewhere | Insights in the four-slot Creator bottom nav |
| Deferred | G2 visual polish of shell |

---

## 4. Authority conflicts

**None unresolved.** Bank ownership cutover accepted in G1C. Settlement adapter remains deferred, not conflicted.

---

## 5. Product decisions required to finish G2.1

**None.** All surfaces above have an explicit owner from accepted Phase G freezes.

---

## 6. Debt / deferred carried into G2.2+

- G1R engineering/fixture debt (unchanged)
- Visual density / Aurora composition (G2.2–G2.5 / later G3)
- Deferred owners listed in G1 gate summary

---

## 7. Phase result

```text
Phase: G2.1 Surface & Ownership Freeze
Status: ACCEPTED

Starting frontend SHA: ee589033128ba082d9993f084d4ff592476c51ee
Final frontend SHA:    (docs commit after this package)
Starting backend SHA:  b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5
Final backend SHA:     b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5

Scope completed: Full surface ownership matrix for required Collaboration surfaces
Acceptance gates: Every surface has one explicit owner; no unresolved authority conflict; no new backend/product rule required
Tests: N/A (docs-only)
Typecheck/lint/build: N/A (docs-only)
Runtime/browser acceptance: N/A (docs-only)
Environment used: Local docs on FE Phase-G branch

Source regressions: None
Authority conflicts: None
Product decisions required: None
Deferred owners: Settlement adapter; relationship-history/Intelligence; taxonomy; Campaign provision; pause/resume; providers/schedulers
Debt carried: G1R register + visual debt into G2.2+

Files created/changed: docs/collaboration/phase-g/11_g2_1_surface_ownership_freeze.md
Documentation file: 11_g2_1_surface_ownership_freeze.md
Commit SHA: (pending package commit)

Next phase: AUTO-PROCEED → G2.2
Reason: Exit gate satisfied; no Product intervention required.
```
