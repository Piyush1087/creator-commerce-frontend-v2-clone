# Collaboration Phase G — G2.3 Submodule UX Freeze

**Status:** ACCEPTED  
**Captured:** 2026-08-15  
**Scope:** G2.3 ONLY — functional UX contracts per execution submodule; no Stitch; no runtime redesign implementation  
**Inputs:** `11_g2_1…`, `12_g2_2…`, G0.3, G1C acceptance  

For each submodule: primary information · primary CTA · secondary actions · capability-driven disabled/read-only · form/control types · confirmation · progress/status · drawers/modals/sheets · Brand variant · Creator variant · terminal variant · deferred.

---

## 1. Negotiation

| Dimension | Freeze |
|---|---|
| Primary information | Proposed / countered / agreed fee; negotiation status from projection |
| Primary CTA | Capability-gated Accept (Brand) or respond action when projected |
| Secondary actions | Counter (one Brand counter MVP); Decline when projected |
| Disabled / read-only | When negotiation actions absent or negotiation locked / lifecycle moved on |
| Controls | Fee display; counter amount input when countering; primary buttons |
| Confirmation | Decline/accept may use confirm pattern if destructive ambiguity; do not invent multi-step policy |
| Progress | Stage indicator shows Negotiation active |
| Overlays | None required beyond standard alerts |
| Brand | Accept / Counter / Decline when capable |
| Creator | Wait or respond per projected actions only |
| Terminal | Closed; history of agreed fee may remain visible in later stages |
| Deferred | Multi-round beyond one-counter MVP |

## 2. Securement

| Dimension | Freeze |
|---|---|
| Primary information | Amount to secure; reserve decomposition when projected; payout-details prerequisite state |
| Primary CTA | Fund / confirm when Brand-capable; otherwise status explanation |
| Secondary actions | Link to Settings/Payout for Creator bank; Creator Cancel when `CancelCollaborationByCreator` present |
| Disabled / read-only | `AWAITING_PAYOUT_DETAILS` → Settings link, no fake bank form in Collab |
| Controls | Fund CTA; outbound link; cancel confirm |
| Confirmation | Cancel requires explicit confirm |
| Progress | Securement stage active after negotiation lock |
| Overlays | Confirm dialog for cancel |
| Brand | Funding CTAs |
| Creator | Bank via Settings; Cancel when capable |
| Terminal | Residual securement/resolution as projected |
| Deferred | Live Razorpay / production money |

## 3. Fulfillment

| Dimension | Freeze |
|---|---|
| Primary information | Support snapshot; issue history description-first |
| Primary CTA | Provide / Confirm / Report issue / Remediate per capability |
| Secondary actions | Optional evidence attach if already supported |
| Disabled / read-only | When actions absent; legacy bound |
| Controls | Description textarea (mandatory 3…2000); **no taxonomy selector**; opaque `issueCode` transport only if retained — not shown as category |
| Confirmation | Report-issue / remediate as needed |
| Progress | Sequence-driven remediation (#1 then hard-stop) — UI must not invent code-based branches |
| Overlays | Issue form sheet/modal acceptable |
| Brand / Creator | Per projected role actions |
| Terminal | COMPLETED / HARD_STOP / BLOCKED as projected |
| Deferred | Product taxonomy |

## 4. Production

| Dimension | Freeze |
|---|---|
| Primary information | Per-Deliverable status + version list |
| Primary CTA | Submit / Approve / Request revision / Final reject per capability |
| Secondary actions | View version detail |
| Disabled / read-only | Empty legacy deliverables unavailable; auto-approval ≠ publish permission |
| Controls | Upload/submit; review notes; revision request |
| Confirmation | Final reject confirm |
| Progress | Per deliverable, not fake global complete |
| Overlays | Revision note modal/sheet OK |
| Brand / Creator | Review vs submit roles as projected |
| Terminal | Per deliverable terminal states |
| Deferred | 72h auto-approval scheduler |

## 5. Publishing

| Dimension | Freeze |
|---|---|
| Primary information | `publishingRequired` honesty; authorize/evidence/verify state |
| Primary CTA | Authorize / Decline / Submit evidence / Verify when capable |
| Secondary actions | Correction entry to Compliance path |
| Disabled / read-only | When not required or actions absent; contract failure if bool invalid |
| Controls | Boolean-required presentation; evidence fields |
| Confirmation | Decline/authorize confirm as needed |
| Progress | Per deliverable publishing card |
| Overlays | Evidence sheet OK |
| Brand / Creator | Per actions |
| Terminal | As projected |
| Deferred | Live social verification provider |

## 6. Compliance

| Dimension | Freeze |
|---|---|
| Primary information | Correction requirements distinct from Production revision |
| Primary CTA | Submit correction when capable |
| Secondary actions | View prior compliance notes |
| Disabled / read-only | When actions absent / legacy bound |
| Controls | Correction form |
| Confirmation | As needed |
| Progress | Publishing-adjacent, not a new lifecycle stage |
| Overlays | Sheet/modal OK |
| Brand / Creator | Per actions |
| Terminal | As projected |
| Deferred | Provider depth |

## 7. Resolution

| Dimension | Freeze |
|---|---|
| Primary information | Cancelled/Terminated reason; stage at resolution; financial resolution summary when projected |
| Primary CTA | None after terminal except residual settlement/view |
| Secondary actions | Navigate history in Chat |
| Disabled / read-only | After terminal — read-only |
| Controls | Display cards |
| Confirmation | N/A post-terminal |
| Progress | Terminal marker |
| Overlays | None |
| Brand / Creator | Same read model; prior actor differences only in how terminal was reached |
| Terminal | Primary surface |
| Deferred | Pause/resume |

## 8. Settlement

| Dimension | Freeze |
|---|---|
| Primary information | Entitlement state; eligible ≠ paid; pending/blocked/unavailable honesty |
| Primary CTA | ConfirmSettlement only if action projected (adapter present) |
| Secondary actions | None invented |
| Disabled / read-only | While adapter unavailable — show deferred/unavailable truthfully |
| Controls | Status card; no FE tranche math |
| Confirmation | Confirm settlement when capable |
| Progress | Residual after resolution/completion as projected |
| Overlays | None required |
| Brand / Creator | As projected |
| Terminal | Residual visible |
| Deferred | **Settlement execution adapter** |

## 9. Completion

| Dimension | Freeze |
|---|---|
| Primary information | Completed lifecycle state |
| Primary CTA | Open Feedback when capable |
| Secondary actions | View chat history |
| Disabled / read-only | Messaging closed |
| Controls | Completed panel |
| Confirmation | N/A |
| Progress | Completed marker |
| Overlays | None |
| Brand / Creator | Both |
| Terminal | Completed |
| Deferred | None |

## 10. Feedback

| Dimension | Freeze |
|---|---|
| Primary information | Feedback window open/closed; own submission state; reveal rules |
| Primary CTA | SubmitCollaborationFeedback when capable |
| Secondary actions | None |
| Disabled / read-only | After submit / window closed; counterpart hidden until reveal |
| Controls | Rating/comment per existing contract — do not invent new scoring policy |
| Confirmation | Submit confirm optional |
| Progress | Post-completion only |
| Overlays | Form panel/sheet OK |
| Brand / Creator | Both; double-blind |
| Terminal | Reveal scheduler deferred |
| Deferred | Reveal scheduler runtime |

---

## Cross-cutting submodule rules

1. Primary CTAs appear only when `availableActions` includes the command.
2. Missing capability ⇒ disabled/hidden per existing accepted patterns — do not invent always-on CTAs.
3. Pane-local errors; retain hydrated data where G1B freeze requires.
4. No debug metadata, raw `issueCode` taxonomy labels, or bank forms inside Collab.
5. Stitch (later) may restyle controls but may not add actions or fields not frozen here.

---

## Phase result

```text
Phase: G2.3 Submodule UX Freeze
Status: ACCEPTED

Starting frontend SHA: ee589033128ba082d9993f084d4ff592476c51ee
Final frontend SHA:    (docs commit after this package)
Starting backend SHA:  b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5
Final backend SHA:     b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5

Scope completed: Functional UX contracts for Negotiation through Feedback
Acceptance gates: Every listed submodule has a frozen functional presentation contract
Product decisions required: None
Deferred owners: unchanged

Documentation file: 13_g2_3_submodule_ux_freeze.md

Next phase: AUTO-PROCEED → G2.4
Reason: Exit gate satisfied.
```
