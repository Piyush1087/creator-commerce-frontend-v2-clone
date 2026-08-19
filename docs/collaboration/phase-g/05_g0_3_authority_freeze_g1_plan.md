# Collaboration Phase G — G0.3 Authority Freeze & G1 Implementation Plan

**Status:** COMPLETE (synthesis only)  
**Captured:** 2026-08-14  
**Scope:** G0.3 ONLY — no runtime source changes, no Stitch, no merge, no deploy  
**Inputs:** `00_baseline.md` … `04_g0_2_interaction_recovery_mobile.md`, Product G0.3 prompt  

This phase synthesizes G0. It does not reopen resolved investigations without new evidence.

---

## 1. G0 completion statement

G0.0 baseline freeze, G0.1 whole-module reality audit, and G0.2A–C root-cause /
ownership / interaction investigations are complete as **source-level Product
readiness work**.

- Core Collaboration architecture (shared workspace, HTTP authority, realtime
  invalidate-and-refetch, five-stage execution, `availableActions`) is sound.
- Material product-readiness gaps are identified, root-caused, and dispositioned
  into G1 packages or explicitly deferred.
- Product decisions required to start G1 are frozen below.
- **No G1R / G1A implementation begins from this document alone** — wait for
  Product authorization of the next prompt.

---

## 2. Frozen Product decisions

| Topic | Freeze |
|---|---|
| **Operational Brand route** | `/brand/collaborations` |
| **Operational Creator route** | `/creator/collaborations` |
| **`/brand/collaboration-page`** | Separate Brand preview/page — **not** operational Collaboration |
| **BRAND actor** | Brand Collaboration only |
| **CREATOR actor** | Creator Collaboration only |
| **ADMIN** | Not an operational Collaboration actor for MVP |
| **UNKNOWN / unresolved role** | Must **never** default to Brand |
| **Deep-link unavailable** | Headline: *Collaboration unavailable* · Body: *This collaboration may no longer be available or you may not have access.* · Recovery: *Back to Collaborations* |
| **Message lifecycle** | History always visible; Send only when `availableActions` includes `PostCollaborationMessage`; PAUSED/COMPLETED/CANCELLED/TERMINATED → Send disabled. FE consumes capability authority — does not re-encode lifecycle lists. Read-only copy: *Messaging is closed for this collaboration. You can still view the conversation history.* |
| **Fulfillment issue UX** | Description-first MVP; mandatory description; optional evidence; no user-facing taxonomy; no invented categories; opaque `issueCode` transport OK temporarily; UI must not display/interpret as taxonomy; sequence-driven remediation |
| **Counterpart context MVP** | Brand→Creator: name, handle, Campaign, Asset, Brief. Creator→Brand: Brand name, Campaign, Asset, Brief. Existing detail only. No Phase G history endpoint. No fabricated Intelligence/history/Trust/analytics. Execution detail stays in Hub |
| **Creator bank** | Settings/Payout owns bank truth. Collaboration consumes payout-readiness / links out; must not remain canonical writer |
| **Settlement** | Collaboration owns entitlement, financial resolution, settlement projection. Payout/Escrow owns money movement. Adapter = **DEFERRED_OWNER** |
| **Inbox identity** | Counterpart + Campaign + Asset + Brief from existing projection. No `appliedAt` unless later proven insufficient |
| **Creator mobile bottom nav** | Four slots: **Home · Campaigns · Collaborations · Profile**. Remove Insights from the four-slot bottom nav only (Insights may remain elsewhere). Label: **Collaborations** |
| **Realtime degraded MVP** | HTTP authority; retain hydrated data; degraded notice; Manual Refresh; reconnect → authoritative refetch; **NO** fallback polling |
| **LEGACY_COMPATIBILITY** | Not presented as fully canonical execution. History/context may remain; per-Deliverable canonical controls read-only/unavailable. No user-facing “legacy”, `sourceApplicationId`, `projectionSource`, or debug metadata. Copy: Headline *Limited collaboration details* · Body *Some details and actions are unavailable because this collaboration was created using an earlier workflow.* |

**LEGACY_MIGRATION_BLOCKER:** **Not raised.** G0 evidence shows legacy logistics
actions are rejected on Application-origin (canonical) rows; compatibility rows
are pre-foundation / null `sourceApplicationId`. No evidence that active
production Collaborations depend on executing legacy-only actions for MVP.

---

## 3. Collaboration Authority Matrix

For each surface: purpose · canonical owner · persisted/read authority · FE
presentation · mutation · capability · actors · canonical/compat · loading ·
empty · error · read-only · terminal · mobile · deferred.

### 1. Collaboration Inbox
| Dimension | Freeze |
|---|---|
| Purpose | List actor-owned Collaborations; select thread |
| Canonical owner | Collaboration query / list projection |
| Persisted/read authority | `GET /threads` scoped by Brand/Creator |
| FE presentation | Inbox pane / mobile step 1 |
| Mutation | Selection / search only |
| Capability | N/A (read) |
| Actors | Brand, Creator (not Admin) |
| Canonical/compat | Show identity hierarchy; bound legacy visually (COL-G0-013) |
| Loading / empty / error | Distinct; keep prior rows on refetch fail |
| Read-only / terminal | List still shows terminal rows |
| Mobile | Step 1; Creator bottom-nav entry required |
| Deferred | Pagination beyond current cap; appliedAt |

### 2. Collaboration Workspace
| Dimension | Freeze |
|---|---|
| Purpose | Compose inbox + chat + execution hub |
| Canonical owner | Collaboration FE feature module |
| Persisted/read authority | List + detail + messages HTTP |
| FE presentation | Desktop 3-pane; mobile steps |
| Mutation | Via child surfaces only |
| Capability | Aggregates child authorities |
| Actors | Brand, Creator |
| Canonical/compat | Role-gated mount; no Brand fallback |
| Loading / empty / error | Pane-local; global alert retired |
| Read-only | Per child |
| Terminal | Resolution + residual settlement visible |
| Mobile | Stepped; deep-link → chat step |
| Deferred | G2 composition |

### 3. Chat / Messages
| Dimension | Freeze |
|---|---|
| Purpose | Conversation history + send when allowed |
| Canonical owner | Collaboration messaging |
| Persisted/read authority | Messages GET; detail `availableActions` |
| FE presentation | Chat pane / step 2 |
| Mutation | `POST …/messages` only if capability present |
| Capability | `PostCollaborationMessage` |
| Actors | Brand, Creator |
| Canonical/compat | Same policy |
| Loading / empty / error | Empty-zero copy; send busy/fail pane-local |
| Read-only | Frozen Product copy when capability absent |
| Terminal | History visible; send disabled |
| Mobile | Composer + keyboard usable |
| Deferred | Pause command surface |

### 4. Counterpart Context
| Dimension | Freeze |
|---|---|
| Purpose | Light identity / source context drawer |
| Canonical owner | Collaboration detail compose |
| Persisted/read authority | Existing detail identity + sourceContext |
| FE presentation | Context drawers |
| Mutation | None |
| Capability | N/A |
| Actors | Brand views Creator; Creator views Brand |
| Canonical/compat | MVP field list only |
| Loading / empty / error | Product copy; no technical language |
| Read-only | Always |
| Terminal | Still show MVP fields |
| Mobile | Sheet/drawer from chat |
| Deferred | Relationship history / Intelligence |

### 5. Negotiation
| Dimension | Freeze |
|---|---|
| Purpose | Fee negotiation / one Brand counter |
| Canonical owner | Collaboration commercial / negotiation commands |
| Persisted/read authority | Detail commercial + actions |
| FE presentation | Negotiation panel in hub |
| Mutation | Accept/counter/decline commands |
| Capability | Negotiation `availableActions` |
| Actors | Brand, Creator per action |
| Canonical/compat | No fake negotiation on empty legacy commercial |
| Loading / empty / error | Pane-local; stale refresh |
| Read-only | When actions absent |
| Terminal | Closed when negotiation locked / lifecycle ends |
| Mobile | Hub step 3 |
| Deferred | None for MVP one-counter |

### 6. Securement
| Dimension | Freeze |
|---|---|
| Purpose | Escrow / zero-cash / payout-details prerequisite |
| Canonical owner | Collaboration securement + Escrow/Payout readiness |
| Persisted/read authority | Detail securement projection |
| FE presentation | Securement panel; link to Settings for bank |
| Mutation | Funding / confirm commands; bank write **not** Collab |
| Capability | Securement actions |
| Actors | Brand, Creator |
| Canonical/compat | Bound when projection incomplete |
| Loading / empty / error | Pane-local |
| Read-only | `AWAITING_PAYOUT_DETAILS` → Settings link |
| Terminal | Residual as projected |
| Mobile | Hub |
| Deferred | Live Razorpay / production money |

### 7. Fulfillment
| Dimension | Freeze |
|---|---|
| Purpose | Brand support provide / confirm / issue / remediate |
| Canonical owner | Collaboration Fulfillment |
| Persisted/read authority | Locked snapshot + fulfillment state |
| FE presentation | Fulfillment panel |
| Mutation | Provide / confirm / report-issue / remediate |
| Capability | Fulfillment actions |
| Actors | Brand, Creator |
| Canonical/compat | Description-first issue; sequence remediation |
| Loading / empty / error | Pane-local |
| Read-only | When actions absent / legacy bound |
| Terminal | COMPLETED / HARD_STOP / BLOCKED as projected |
| Mobile | Hub |
| Deferred | Product taxonomy (explicitly not for MVP) |

### 8. Production
| Dimension | Freeze |
|---|---|
| Purpose | Per-Deliverable submit / review / revision |
| Canonical owner | Collaboration Production |
| Persisted/read authority | Deliverable executions + versions |
| FE presentation | Production panels |
| Mutation | Submit / approve / revision / final reject |
| Capability | Deliverable actions |
| Actors | Brand, Creator |
| Canonical/compat | Unavailable for legacy empty deliverables |
| Loading / empty / error | Pane-local |
| Read-only | Auto-approval ≠ publish permission |
| Terminal | Per deliverable |
| Mobile | Hub |
| Deferred | 72h auto-approval scheduler runtime |

### 9. Publishing
| Dimension | Freeze |
|---|---|
| Purpose | Per-Deliverable authorize / evidence / verify |
| Canonical owner | Collaboration Publishing |
| Persisted/read authority | Publishing execution + `publishingRequired` |
| FE presentation | Publishing cards |
| Mutation | Authorize / decline / evidence / verify / correction |
| Capability | Publishing actions |
| Actors | Brand, Creator |
| Canonical/compat | Strict boolean; never coerce missing → false |
| Loading / empty / error | Contract failure if invalid read |
| Read-only | When not required or actions absent |
| Terminal | As projected |
| Mobile | Hub |
| Deferred | Live social verification provider |

### 10. Compliance
| Dimension | Freeze |
|---|---|
| Purpose | Separate correction path from Production revision |
| Canonical owner | Collaboration Publishing/compliance |
| Persisted/read authority | Detail projection |
| FE presentation | Compliance UI where present |
| Mutation | Correction commands |
| Capability | Related actions |
| Actors | Brand, Creator |
| Canonical/compat | Bound on legacy |
| Loading / empty / error | Pane-local |
| Read-only | When actions absent |
| Terminal | As projected |
| Mobile | Hub |
| Deferred | None beyond provider |

### 11. Settlement
| Dimension | Freeze |
|---|---|
| Purpose | Entitlement / projection of settlement states |
| Canonical owner | Collaboration entitlement; Payout/Escrow money |
| Persisted/read authority | Settlement projection |
| FE presentation | SettlementCard — eligible ≠ paid |
| Mutation | ConfirmSettlement when adapter exists |
| Capability | Settlement actions when projected |
| Actors | System / deferred adapter |
| Canonical/compat | Show pending/blocked truthfully |
| Loading / empty / error | Pane-local |
| Read-only | While adapter unavailable |
| Terminal | Residual settlement visible |
| Mobile | Hub |
| Deferred | **Settlement execution adapter** |

### 12. Resolution
| Dimension | Freeze |
|---|---|
| Purpose | Cancelled/Terminated reason + stage visibility |
| Canonical owner | Collaboration exception / resolution projection |
| Persisted/read authority | Detail resolution |
| FE presentation | ResolutionCard |
| Mutation | End / cancel commands |
| Capability | Exception actions |
| Actors | Brand end; Creator cancel |
| Canonical/compat | Visible for terminal |
| Loading / empty / error | Pane-local |
| Read-only | After terminal |
| Terminal | Primary |
| Mobile | Hub |
| Deferred | Pause/resume |

### 13. Completion
| Dimension | Freeze |
|---|---|
| Purpose | Completed lifecycle presentation |
| Canonical owner | Collaboration lifecycle |
| Persisted/read authority | Detail lifecycle |
| FE presentation | CompletedPanel |
| Mutation | Feedback only if capability |
| Capability | Feedback actions; **not** message |
| Actors | Both |
| Canonical/compat | Read-only messaging |
| Loading / empty / error | Pane-local |
| Read-only | Messaging closed copy |
| Terminal | Completed |
| Mobile | Hub + chat history |
| Deferred | None |

### 14. Feedback
| Dimension | Freeze |
|---|---|
| Purpose | Post-completion double-blind feedback |
| Canonical owner | Collaboration feedback |
| Persisted/read authority | Feedback window + rows |
| FE presentation | Feedback UI |
| Mutation | SubmitCollaborationFeedback |
| Capability | Feedback action |
| Actors | Brand, Creator |
| Canonical/compat | Hidden until reveal |
| Loading / empty / error | Pane-local |
| Read-only | After submit / window closed |
| Terminal | Reveal scheduler deferred |
| Mobile | Hub |
| Deferred | Reveal scheduler |

### 15. Creator cancellation
| Dimension | Freeze |
|---|---|
| Purpose | Creator cancel when projected |
| Canonical owner | Collaboration exception |
| Persisted/read authority | `CancelCollaborationByCreator` in actions |
| FE presentation | **Missing presenter → G1B** |
| Mutation | `POST …/cancel-by-creator` |
| Capability | CancelCollaborationByCreator |
| Actors | Creator |
| Canonical/compat | Only when projected |
| Loading / empty / error | Confirm + pane error |
| Read-only | When action absent |
| Terminal | Becomes cancelled |
| Mobile | Hub sticky/primary when available |
| Deferred | None |

### 16. Realtime degraded state
| Dimension | Freeze |
|---|---|
| Purpose | Survive socket loss without losing HTTP authority |
| Canonical owner | FE realtime hook + HTTP |
| Persisted/read authority | HTTP always |
| FE presentation | Degraded notice + Manual Refresh |
| Mutation | Commands still via HTTP |
| Capability | Unchanged |
| Actors | Both |
| Canonical/compat | Same |
| Loading / empty / error | Notice ≠ data corrupt |
| Read-only | N/A |
| Terminal | N/A |
| Mobile | Refresh on all steps |
| Deferred | Polling (explicitly out) |

### 17. Legacy compatibility
| Dimension | Freeze |
|---|---|
| Purpose | Bound pre-foundation rows |
| Canonical owner | BE projectionSource + FE presentation |
| Persisted/read authority | LEGACY_COMPATIBILITY mapper |
| FE presentation | Limited-details Product copy; no debug fields |
| Mutation | No silent canonical per-Deliverable controls |
| Capability | Only truthful projected actions |
| Actors | Both |
| Canonical/compat | **Compatibility mode** |
| Loading / empty / error | Same panes |
| Read-only | Execution controls unavailable/read-only |
| Terminal | History/context OK |
| Mobile | Same |
| Deferred | Migration removal date (not invented) |

### 18. Mobile navigation
| Dimension | Freeze |
|---|---|
| Purpose | Reach operational Collaborations on mobile |
| Canonical owner | App shell |
| Persisted/read authority | N/A |
| FE presentation | Bottom nav + drawer |
| Mutation | Navigation only |
| Capability | N/A |
| Actors | Brand (Chat), Creator (Collaborations slot) |
| Canonical/compat | N/A |
| Loading / empty / error | Shell-level |
| Read-only | N/A |
| Terminal | N/A |
| Mobile | Creator: Home · Campaigns · Collaborations · Profile |
| Deferred | Insights elsewhere; G2 visual |

---

## 4. Finding disposition matrix — COL-G0-001 through COL-G0-022

| ID | Final disposition | Owning module | FE/BE/Both | Product decision | Implementation package | Acceptance requirement |
|---|---|---|---|---|---|---|
| COL-G0-001 | G1_IMPLEMENT | Auth + Collaboration FE | FE | Frozen (no Admin/unknown→Brand) | G1A | Opposite-role redirect; unknown unsupported; no Brand fallback |
| COL-G0-002 | G1_IMPLEMENT | Collaboration FE | FE | Frozen unavailable copy | G1A | No silent `rows[0]`; 404 → unavailable + Back |
| COL-G0-003 | G1_IMPLEMENT | Collaboration FE | FE | Frozen fields; no appliedAt | G1A | Inbox shows counterpart+Campaign+Asset+Brief |
| COL-G0-004 | G1_IMPLEMENT | Collaboration FE | FE | Strict publishingRequired | G1A | Zod/read validate; missing bool ≠ false |
| COL-G0-005 | G1_ACCEPT_EXISTING_HOTFIX | Brand-UCE / provision | BE | Closed | G1R | Acceptance gate §7/G1R; no silent default |
| COL-G0-006 | G1_IMPLEMENT | Collaboration FE | FE | Soft copy optional | G1B | Pane-local errors + recovery matrix |
| COL-G0-007 | G1_IMPLEMENT | Collaboration messaging | Both | Frozen lifecycle + copy | G1B | Actions + POST + composer gated |
| COL-G0-008 | G1_IMPLEMENT | Collaboration FE | FE | Closed | G1B | Cancel presenter when capability present |
| COL-G0-009 | G1_IMPLEMENT | Collaboration FE | FE | Description-first freeze | G1C | No taxonomy UI; description mandatory |
| COL-G0-010 | G1_IMPLEMENT | Collaboration FE | FE | MVP field list freeze | G1C | Compose existing detail only |
| COL-G0-011 | G1_IMPLEMENT | Collaboration FE | FE | Product drawer copy | G1C | No technical/debug language |
| COL-G0-012 | G1_IMPLEMENT | Creator Payouts + Settings; Collab deprecation | Both | Settings owns bank | G1C | FE cutover; BE endpoint deprecate after consumer search |
| COL-G0-013 | G1_IMPLEMENT | Collaboration FE (+ BE projection exists) | FE | Limited-details copy freeze | G1A | Bound legacy presentation; no debug metadata |
| COL-G0-014 | G1_IMPLEMENT | Collaboration FE | FE | No polling | G1B | Manual Refresh + reconnect refetch |
| COL-G0-015 | G1_IMPLEMENT | FE env/config | FE | Fail-fast prod URL | G1A | Prod missing URL throws; DEV localhost OK |
| COL-G0-016 | G1_IMPLEMENT | Collaboration FE | FE | State matrix freeze | G1B | Empty/busy/read-only states present |
| COL-G0-017 | RESOLVED_NO_CODE | Routes / IA | — | Frozen | — | Routes unchanged in G1; preview preserved |
| COL-G0-018 | G1_IMPLEMENT | App shell | FE | Four-slot Creator nav freeze | G1A | Collaborations in bottom nav; Insights removed from four |
| COL-G0-019 | G2_UX_VISUAL | Aurora / composition | FE | G2 owns visual | Outside G1 | Functional access only in G1 |
| COL-G0-020 | G1_IMPLEMENT | Collaboration FE engineering | FE | Closed | G1A | Vitest + fixtures for G1 gates |
| COL-G0-021 | DOCUMENTATION_DEBT | Docs | Docs | Closed | Outside G1 (closure point) | Archive/reconcile tracker later |
| COL-G0-022 | DEFERRED_OWNER | Payout/Escrow | BE external | Closed ownership | Outside G1 | Adapter task separate; FE keeps eligible≠paid |

**All 22 findings accounted for: YES**

---

## 5. Deferred-owner register

| Owner | Item | Finding |
|---|---|---|
| Payout / Escrow | Settlement money-movement adapter | COL-G0-022 |
| Pause / resume policy | Command surface | Noted in messaging freeze |
| Auto-approval scheduler | 72h Production | Environmental / deferred runtime |
| Feedback reveal scheduler | Reveal window | Deferred runtime |
| Asset / publishing verification providers | Live providers | Deferred |
| Relationship history / Intelligence | Counterpart rich context | Explicitly out of Phase G MVP |
| Production money / Postmark / S3 / Razorpay live | Env | Blocked from local acceptance |

---

## 6. Compatibility / migration policy

1. **LEGACY_COMPATIBILITY rows** — bounded presentation; Product limited-details copy; no debug fields; no silent canonical execution.
2. **Legacy query param `collaboration`** — accept read; normalize writes to `thread`.
3. **Collaboration bank write endpoint** — temporary compatibility until G1C FE cutover + consumer search; then deprecate.
4. **Legacy logistics issue enums** — not MVP taxonomy; blocked on canonical Application-origin rows.
5. **Do not invent** migration removal dates.
6. **LEGACY_MIGRATION_BLOCKER** — not raised on current evidence.

---

## 7. G1R specification — Backend canonical hotfix acceptance

**Scope:** COL-G0-005 only.  
**Objective:** Formally accept or reject `efffc2701a61bbd49748a28608d54f927ee44a4e` on `feature/collab-clone-reconcile-be`.  
**No unrelated backend work.**

| Item | Value |
|---|---|
| Pre-fix SHA | `0385c8a06abed604402621c1a3e94ee1c4e6d0e6` |
| Post-fix SHA | `efffc2701a61bbd49748a28608d54f927ee44a4e` |
| Files | brand-uce pipeline DTO/service; campaign-application approve handoff |

**Acceptance gate (minimum):**
- Prisma validate/generate where applicable
- Brand-UCE / Collaboration provision regressions covering approve mapping
- Existing Collaboration backend regression suite (or documented subset covering provision)
- Nest production build
- Prove: no silent `publishingRequired: true` default
- Prove: explicit `deliverable_publishing_applicability` required
- Prove: Applications approve does not auto-provision without mapping

**Exit:** `ACCEPTED` backend SHA **or** `NOT ACCEPTED` with reason.  
Becomes Phase-G backend baseline only after acceptance.

---

## 8. G1A specification — Foundation, access & read integrity

**Primary findings:** 001, 002, 003, 004, 013, 015, 018, 020  

**Scope:**
- Minimum Vitest FE harness + fixtures
- Brand/Creator role-aware routes; no Admin/unknown → Brand
- Deep-link resolution + unavailable state (frozen copy)
- Collaboration read Zod validation; strict `publishingRequired`
- Bounded LEGACY_COMPATIBILITY presentation (frozen copy)
- Inbox identity: counterpart + Campaign + Asset + Brief
- Production API URL fail-fast
- Creator bottom nav: Home · Campaigns · Collaborations · Profile
- Deep-link → Chat mobile step

Prefer FE-only. No visual redesign.

**Exit:** Package acceptance report (template §12).

---

## 9. G1B specification — Interaction authority & recovery

**Primary findings:** 006, 007, 008, 014, 016  

**Scope:**
- BE: `deriveAvailableActions` lifecycle alignment for messaging
- BE: `postMessage` lifecycle enforcement
- FE: composer capability gating + frozen read-only copy
- Pane-local errors; loading/empty/processing; send busy/failure
- Stale/refetch; Manual Refresh; degraded recovery (no polling)
- Creator cancellation presenter

Cross-layer because of COL-G0-007.

**Exit:** Package acceptance report; BE+FE SHAs recorded.

---

## 10. G1C specification — Ownership & context cleanup

**Primary findings:** 009, 010, 011, 012  

**Scope:**
- Description-first Fulfillment issue UX; remove invented taxonomy
- Compose MVP counterpart detail; remove technical drawer copy
- Creator Payouts → Settings/Payout bank API cutover
- Safe deprecation path for Collaboration bank write after consumer search

Do **not** create relationship-history API, Intelligence, or settlement adapter.

**Exit:** Package acceptance report.

---

## 11. Dependency / order map

```
G1R (accept BE hotfix baseline)
  ↓
G1A (FE foundation / access / read integrity / harness)
  ↓
G1B (messaging BE+FE + recovery)     ─┐
  ↓                                    ├─ optional parallel AFTER G1A
G1C (ownership / context / bank)     ─┘   if baselines stay clean
  ↓
G1 consolidated local acceptance
  ↓
G2
```

**Rule:** Each package starts from the last accepted Phase G baseline — no
unreviewed parallel drift. Prefer serial G1B → G1C unless Product/engineering
explicitly accepts parallel after G1A with shared baseline discipline.

G1B and G1C may run in parallel **after G1A** only if:
- G1R accepted;
- G1A accepted;
- no shared file thrash without rebase onto accepted tip.

---

## 12. G1 acceptance template

For each package report:

| Field | Value |
|---|---|
| Starting frontend SHA | |
| Starting backend SHA | |
| Final frontend SHA | |
| Final backend SHA | |
| Files changed | |
| Findings closed | |
| Tests added | |
| Tests passed | |
| Typecheck | |
| Production build | |
| Applicable backend regression | |
| Runtime smoke (if env available) | |
| Compatibility debt retained | |
| Deferred owners retained | |
| Environment blockers | |
| Product blockers | |
| Merge status | not merged unless authorized |
| Deployment status | not deployed |
| **Result** | ACCEPTED / ACCEPTED WITH DEBT / BLOCKED BY ENVIRONMENT / NOT ACCEPTED |

Do not merge automatically.

---

## 13. Local environment readiness

**Required before G1 consolidated functional acceptance (and any runtime smoke):**

- Repository-compatible Node/npm
- Docker Desktop
- PostgreSQL 16
- Isolated local Collaboration DB
- Backend `localhost:3000`
- Frontend `localhost:5173`
- Deterministic Brand QA identity
- Deterministic Creator QA identity (`test@creator.com` seed OK)
- Socket.IO local connectivity
- No production RDS / Postmark / live Razorpay / production S3 writes / real publishing or fund movement

**When required:**
- **G1A / G1C mostly FE + unit tests:** environment should **not** block starting source/test work.
- **G1R + G1B BE messaging tests:** local BE/DB preferred for acceptance.
- **G1 consolidated functional acceptance:** full environment **must** exist before claiming Phase G functional acceptance.

---

## 14. G2 entry criteria

G2 begins only after applicable G1 functional reconciliation is **ACCEPTED**
(or ACCEPTED WITH DEBT with Product acknowledgment).

**G2 owns:** IA, visual hierarchy, workspace composition, Aurora, breakpoints,
card density, typography, loading/empty/error visuals, drawers/sheets visuals,
Stitch-ready state matrix.

**G2 must not reopen:** lifecycle, financial ownership, bank ownership, message
authority, Fulfillment taxonomy, counterpart data ownership, settlement
ownership.

**Stitch prohibited** until G2 freezes the UX authority matrix.

---

## 15. Remaining blockers

| Blocker | Severity | Notes |
|---|---|---|
| Product authorization to start G1R/G1A | Gate | This doc alone does not start G1 |
| G1R acceptance of BE hotfix | Gate | Required before Phase-G BE baseline |
| Local runtime env for consolidated acceptance | Env | Do not block pure FE unit work |
| Settlement adapter | Deferred owner | Outside G1 |
| Pause/resume, schedulers, live providers | Deferred | Outside G1 MVP |
| LEGACY_MIGRATION_BLOCKER | None | Not raised |
| Open Product decisions for G1 start | **None material** | Nav slot frozen; polling frozen; taxonomy frozen |

---

## 16. G0.3 completion assessment

- All prior Product decisions consolidated and frozen
- Authority matrix covers 18 major surfaces
- COL-G0-001 … 022 each have exactly one disposition
- G1R / G1A / G1B / G1C specified with dependency order
- Acceptance template + local env readiness + G2 entry frozen
- No runtime source modified
- **Stops before G1R and G1A**
