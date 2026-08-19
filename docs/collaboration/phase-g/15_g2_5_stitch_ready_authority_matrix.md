# Collaboration Phase G — G2.5 Stitch-Ready Authority Matrix

**Status:** ACCEPTED  
**Captured:** 2026-08-15  
**Scope:** G2.5 ONLY — convert G2 freezes into a design-execution contract; **do not invoke Stitch in this phase**  
**Inputs:** `11`–`14` G2 docs; visual observation pack; Aurora / app shell constraints  
**Operator override:** After this phase, STOP for Product before G3 Stitch.

---

## Global must-not-invent (for any later Stitch run)

Stitch must not redefine: lifecycle stages; `availableActions` semantics; financial/bank ownership; Fulfillment taxonomy; settlement money movement; Intelligence/relationship-history; Admin→Brand fallback; polling; production provider architecture.

Stitch receives: Aurora Design System; current app shell; this matrix; required state variants from G2.4; existing production component boundaries.

---

## Target matrix

### 1. Collaboration Workspace shell

| Dimension | Required |
|---|---|
| Purpose | Host Inbox + Chat + Execution |
| Data authority | Collaboration HTTP list/detail/messages |
| Information hierarchy | Notice strip → three panes (desktop) / steps (mobile) |
| Primary actions | Manual Refresh; step navigation |
| Interaction pattern | Full workspace composition |
| Required states | Loading; degraded realtime; restored |
| Brand/Creator | Role-gated routes |
| Mobile | Stepped IA |
| Deferred | Campaign provision UI |

### 2. Collaboration Header

| Dimension | Required |
|---|---|
| Purpose | Identify thread; open counterpart |
| Data authority | Detail identity + sourceContext shorthand |
| Information hierarchy | Counterpart → Campaign/Asset/Brief → status |
| Primary actions | Open counterpart drawer/sheet |
| Interaction pattern | Header bar |
| Required states | Loaded; unavailable selection |
| Brand/Creator | Counterpart field set differs |
| Mobile | Compact header on Chat step |
| Deferred | Rich analytics |

### 3. Inbox / Collaboration cards

| Dimension | Required |
|---|---|
| Purpose | Select owned Collaboration |
| Data authority | Threads list projection |
| Information hierarchy | Counterpart; Campaign; Asset; Brief; lifecycle |
| Primary actions | Select row |
| Interaction pattern | List / cards |
| Required states | Loading; empty; loaded; failed keep-prior |
| Brand/Creator | Owned filter only |
| Mobile | Step 1 full list |
| Deferred | appliedAt; heavy pagination |

### 4. Chat pane

| Dimension | Required |
|---|---|
| Purpose | History + send when capable |
| Data authority | Messages + `PostCollaborationMessage` |
| Information hierarchy | History first; composer bottom |
| Primary actions | Send when capable |
| Interaction pattern | Message list + composer |
| Required states | Loading; empty-zero; loaded; send_in_progress; send_failed; read_only (closed copy) |
| Brand/Creator | Same policy |
| Mobile | Step 2; keyboard-safe composer |
| Deferred | Pause command |

### 5. Counterpart Context drawer

| Dimension | Required |
|---|---|
| Purpose | MVP light context |
| Data authority | Hydrated detail only |
| Information hierarchy | Identity then Campaign/Asset/Brief |
| Primary actions | Close |
| Interaction pattern | Drawer desktop / sheet mobile |
| Required states | Loading; loaded omit-missing; error Product copy |
| Brand/Creator | Field sets per G2.1 |
| Mobile | Sheet |
| Deferred | History / Intelligence |

### 6. Execution progress / navigation

| Dimension | Required |
|---|---|
| Purpose | Show five-stage progress without inventing stages |
| Data authority | Detail execution projection |
| Information hierarchy | Active stage emphasized |
| Primary actions | Navigate visible stage panels when allowed by projection |
| Interaction pattern | Progress + panel switch |
| Required states | Active; locked later stages; terminal |
| Brand/Creator | Same stages |
| Mobile | Step 3 top |
| Deferred | None |

### 7. Negotiation panel

| Dimension | Required |
|---|---|
| Purpose | Fee negotiation MVP |
| Data authority | Commercial + negotiation actions |
| Information hierarchy | Fee → status → CTAs |
| Primary actions | Accept / Counter / Decline when capable |
| Interaction pattern | Execution card/panel |
| Required states | Active capable; waiting; locked; read-only |
| Brand/Creator | CTA set differs |
| Mobile | Full-width CTAs |
| Deferred | Multi-round beyond one counter |

### 8. Securement panel

| Dimension | Required |
|---|---|
| Purpose | Funding / readiness |
| Data authority | Securement projection + Settings link for bank |
| Information hierarchy | Amount → decomposition → CTA / Settings / Cancel |
| Primary actions | Fund/confirm; Settings link; Cancel when capable |
| Interaction pattern | Execution card/panel + confirm dialog for cancel |
| Required states | Awaiting payout details; fundable; funded; residual |
| Brand/Creator | Brand fund vs Creator Settings/Cancel |
| Mobile | Full-width |
| Deferred | Live Razorpay |

### 9. Fulfillment panel

| Dimension | Required |
|---|---|
| Purpose | Support + issues description-first |
| Data authority | Fulfillment projection/commands |
| Information hierarchy | Snapshot → history descriptions → actions |
| Primary actions | Provide/Confirm/Report/Remediate when capable |
| Interaction pattern | Panel + issue form (no taxonomy UI) |
| Required states | Active; blocked; hard-stop; read-only |
| Brand/Creator | Per actions |
| Mobile | Sheet for issue form |
| Deferred | Taxonomy |

### 10. Production / Deliverable cards

| Dimension | Required |
|---|---|
| Purpose | Per-deliverable production loop |
| Data authority | Production projection |
| Information hierarchy | Deliverable → versions → CTAs |
| Primary actions | Submit/Approve/Revise/Reject when capable |
| Interaction pattern | Card list |
| Required states | Empty unavailable; in review; revision; terminal per deliverable |
| Brand/Creator | Role CTAs |
| Mobile | Stacked cards |
| Deferred | Auto-approval scheduler |

### 11. Publishing / Compliance cards

| Dimension | Required |
|---|---|
| Purpose | Authorize/evidence/verify + compliance correction |
| Data authority | Publishing + compliance projection; strict publishingRequired |
| Information hierarchy | Required flag honesty → state → CTAs |
| Primary actions | Authorize/Decline/Evidence/Verify/Correction when capable |
| Interaction pattern | Cards |
| Required states | Not required; required active; contract failure; provider unavailable |
| Brand/Creator | Per actions |
| Mobile | Stacked |
| Deferred | Live social provider |

### 12. Resolution state

| Dimension | Required |
|---|---|
| Purpose | Terminal reason + financial resolution summary |
| Data authority | Resolution projection |
| Information hierarchy | Reason → stage → financial summary |
| Primary actions | View only |
| Interaction pattern | Resolution card |
| Required states | Cancelled; Terminated |
| Brand/Creator | Same read |
| Mobile | Primary on terminal hub |
| Deferred | Pause/resume |

### 13. Settlement state

| Dimension | Required |
|---|---|
| Purpose | Entitlement projection honesty |
| Data authority | Settlement projection; adapter deferred |
| Information hierarchy | Status → eligible≠paid |
| Primary actions | ConfirmSettlement only if projected |
| Interaction pattern | Settlement card |
| Required states | Pending; blocked; eligible; deferred/unavailable adapter |
| Brand/Creator | As projected |
| Mobile | Card |
| Deferred | Adapter |

### 14. Completion / Feedback

| Dimension | Required |
|---|---|
| Purpose | Completed presentation + double-blind feedback |
| Data authority | Lifecycle + feedback window |
| Information hierarchy | Completed → feedback form when capable |
| Primary actions | Submit feedback when capable |
| Interaction pattern | Completed panel + feedback form |
| Required states | Completed; feedback open; submitted; closed window |
| Brand/Creator | Both; hidden counterpart until reveal |
| Mobile | Hub |
| Deferred | Reveal scheduler |

### 15. Loading / empty / error / degraded variants

| Dimension | Required |
|---|---|
| Purpose | Cross-cutting visual treatments for G2.4 states |
| Data authority | Pane-local FE state over HTTP |
| Information hierarchy | Preserve content when failed_with_data |
| Primary actions | Retry / Refresh / Back per state matrix |
| Interaction pattern | Alerts, empty illustrations, notice strip — Aurora primitives |
| Required states | All G2.4 YES-Stitch rows |
| Brand/Creator | Shared patterns |
| Mobile | Alerts must not obscure Back/Refresh |
| Deferred | None |

### 16. Mobile Collaboration workspace

| Dimension | Required |
|---|---|
| Purpose | Stepped operable Collaboration on narrow viewports |
| Data authority | Same HTTP authority |
| Information hierarchy | Inbox → Chat → Execution |
| Primary actions | Step nav; bottom nav Collaborations entry |
| Interaction pattern | Steps + sheets + full-width CTAs |
| Required states | All mobile rows in G2.4 |
| Brand/Creator | Creator bottom nav freeze mandatory |
| Mobile | Primary target |
| Deferred | Breakpoint visual polish only |

---

## Evidence pack for designers (non-Stitch)

Local screenshots under `docs/collaboration/phase-g/g2-visual-observations/` illustrate current functional UI density; G3 may restyle but must preserve authority in this matrix.

---

## Phase result

```text
Phase: G2.5 Stitch-Ready Authority Matrix
Status: ACCEPTED

Starting frontend SHA: ee589033128ba082d9993f084d4ff592476c51ee
Final frontend SHA:    (docs commit after this package)
Starting backend SHA:  b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5
Final backend SHA:     b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5

Scope completed: 16 Stitch targets specified; must-not-invent rules explicit
Acceptance gates: No unresolved Product decision; no lifecycle/ownership/financial semantics delegated to Stitch; mobile/state variants frozen; Stitch targets explicit
Product decisions required: None for G2 completion

Documentation file: 15_g2_5_stitch_ready_authority_matrix.md

Next phase: STOP — do not start G3 Stitch
Reason: Operator override — autonomous loop authorized through G2.5 only; await Product instruction before Stitch.
```
