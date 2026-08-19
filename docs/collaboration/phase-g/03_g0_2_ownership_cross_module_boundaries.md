# Collaboration Phase G — G0.2B Ownership & Cross-Module Boundaries

**Status:** COMPLETE (source investigation only)  
**Captured:** 2026-08-14  
**Scope:** G0.2B ONLY — no runtime source changes, no Stitch, no merge, no deploy  
**Inputs:** `00_baseline.md`, `01_g0_reality_audit.md`, `02_g0_2_access_identity_read_integrity.md`, Product G0.2B prompt  

Baselines and G0.2A freezes remain in force.

---

## 1. Executive ownership summary

| Finding | Verdict | Ownership violation |
|---|---|---|
| COL-G0-009 | No issue-code taxonomy; sequence drives remediation; FE invents one label | FE invents a category BE does not own |
| COL-G0-010 | Drawers are thin Collab identity + debug copy; no relationship-history API | Missing Brand-scoped history read; debug acceptance UI |
| COL-G0-012 | Dual bank writers on same table with different semantics | Confirmed dual ownership + prerequisite skew |
| COL-G0-022 | Entitlement vs money movement already separated; adapter unavailable | None — DEFERRED_OWNER intact |
| COL-G0-008 / 011 | Direct-G1 (presenter / copy) | Missing presenter / debug copy |

### Product decisions frozen in this prompt

**Admin access**  
Admin is not an operational Brand/Creator Collaboration actor for MVP.  
Admin/unknown role must never default to Brand Collaboration.  
If an Admin-specific operational surface exists elsewhere, preserve it; otherwise
show/route to unsupported-access. (Aligns with G0.2A COL-G0-001 G1 plan.)

**Deep-link no-access copy** (non-enumerating; backend collapses missing + unauthorized to 404)

| Element | Copy |
|---|---|
| Headline | Collaboration unavailable |
| Body | This collaboration may no longer be available or you may not have access. |
| Recovery | Back to Collaborations |

Do not reveal whether the Collaboration exists for another user.

**Inbox identity**  
Do not add `appliedAt` / application-date backend projection during G0/G1 unless
existing projected counterpart + Campaign + Asset + Brief context is proven
insufficient. (Closes the optional BE add-on from G0.2A COL-G0-003.)

---

## 2. Fulfillment issue boundary (COL-G0-009)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-009 |
| Confirmed root cause | Canonical command accepts bounded free-string `issueCode` and never branches on its value. Remediation is sequence-driven (#1 remediation, #2 hard-stop). FE hardcodes `FULFILLMENT_NOT_AS_EXPECTED` behind a disabled one-option field. Legacy logistics enums remain executable only on non-canonical rows. |
| Canonical owner | Collaboration Fulfillment command + issue rows |
| Current owner(s) | Same + FE invented label; residual legacy logistics / UCE pipeline enums |
| Ownership violation | FE invents a category label that is not a BE enum and is unused semantically |
| Exact frontend files | `components/execution/FulfillmentPanel.tsx` (~63–66, 120–125); `components/execution/FulfillmentIssueHistory.tsx` (omits `issueCode`) |
| Exact backend files/services | `schemas/collaboration-fulfillment-command.schema.ts` (`issueCode` min1/max100; description min3/max2000); `services/collaboration-fulfillment.service.ts`; legacy `logistics/report-issue` + `FulfillmentIssueType` enum; guard rejecting logistics on canonical rows in `collaboration.service.ts` |
| Existing reusable API/read model | Canonical report-issue + remediation commands; detail projects `issueCode` into fulfillment history |
| Frontend change required | YES — remove invented taxonomy UX; description-first reporting; opaque/free-string code only if Product requires a code field |
| Backend change required | NO for inventing taxonomy. Optional later: deprecate logistics report-issue clarity |
| Compatibility/deprecation impact | Legacy logistics path stays evidence-only for Application-origin Collaborations |
| Privacy/security considerations | None beyond existing Collaboration access |
| Required regression tests | Issue #1 → remediation; #2 → hard-stop; short description rejected; legacy logistics blocked on canonical rows |
| Deferred owner/dependency | None for MVP sequence behavior |
| Remaining Product decision | YES — define user-visible categories, or freeze description-only (+ opaque free-string `issueCode` if retained for storage) |
| Recommended G1 scope | FE issue-form honesty; optional Brand history display of stored code as opaque text |
| Stitch relevance | Only if Product later adds multi-category UX |

### Direct answers

| Question | Answer |
|---|---|
| Canonical issue-code taxonomy? | **No** |
| issueCode shape? | Bounded free-string |
| Values BE recognizes semantically? | **None** (stored + event payload only) |
| Legacy Logistics enums? | Executable only when `sourceApplicationId` is null; evidence-only for canonical MVP |
| Remediation depends on code? | **No** — sequence only |
| Smallest truthful Creator UX? | Mandatory description (+ optional evidence); do not invent categories |
| Description? | **Mandatory** |
| Brand sees same classification? | Same read model has `issueCode`; history UI currently does not render it |

**Do not invent a taxonomy in G0/G1.** If Product needs categories, Product must define them explicitly.

---

## 3. Brand → Creator context boundary (COL-G0-010)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-010 (Brand→Creator half) |
| Confirmed root cause | Drawer shows handle/campaign and technical “dedicated Brand-scoped endpoint” copy. Collaboration detail already carries thin creator identity + sourceContext. Public media kit exists but is not Brand-scoped Collaboration context. Brand-scoped prior relationship/history query does not exist. |
| Canonical owner | Collaboration context read + profile/privacy owners |
| Current owner(s) | Thin Collab identity/sourceContext; Public Creator media kit (separate); drawers as placeholder |
| Ownership violation | Debug acceptance UI; missing history read — not Collab wrongly owning Intelligence |
| Exact frontend files | `context/CreatorContextDrawer.tsx` |
| Exact backend files/services | `collaboration-thread.mapper.ts` creatorSummary / sourceContext; public `GET /api/v1/public/creators/:slug/media-kit` |
| Existing reusable API/read model | Collaboration detail identity + campaign/asset/brief; public media kit (privacy-weak if multi-fetched as Brand workspace context) |
| Frontend change required | YES — Product copy; compose already-available Collab detail fields; isolated loading/error when extra fetches arrive |
| Backend change required | YES later for Brand-scoped history / richer counterpart summary — **not** required to render Campaign/Brief already on detail |
| Compatibility/deprecation impact | None |
| Privacy/security considerations | No other-Brand history; no Trust/admin scores; do not treat public media kit as Brand relationship scope |
| Required regression tests | Drawer renders available Collab context without technical copy; no fabricated history |
| Deferred owner/dependency | Relationship-history / Intelligence owners — **deferred** (data does not exist today) |
| Remaining Product decision | MVP drawer contents without history; later authorize Brand-scoped history DTO |
| Recommended G1 scope | Compose existing detail + COL-G0-011 copy; history endpoint as later slice |
| Stitch relevance | UNKNOWN / later with G2 if composition expands |

### Field availability (Brand → Creator)

| Desired field | Available in Collab today? |
|---|---|
| Public identity (name/handle) | Partial (id, displayName, handle) |
| Avatar / location | No on Collab identity |
| Profile / performance facts | Public media kit exists; not composed into Collab |
| Campaign-relevant context | Yes on detail (`sourceContext` + commercial/lifecycle) |
| Brand-scoped prior relationship/history | **Does not exist** — defer |

---

## 4. Creator → Brand context boundary (COL-G0-010)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-010 (Creator→Brand half) |
| Confirmed root cause | Drawer shows campaign/brief + technical “dedicated canonical endpoint” copy. Detail already has Brand name + Campaign/Asset/Brief + commercial/execution. Extended Brand analytics / relationship history do not exist for MVP. |
| Canonical owner | Collaboration context read (lighter Brand/Campaign/Brief context per canonical intent) |
| Current owner(s) | Collab detail projection; Brand profile owners for website/category elsewhere |
| Ownership violation | Debug copy; underuse of already-projected sourceContext |
| Exact frontend files | `context/BrandContextDrawer.tsx` |
| Exact backend files/services | `collaboration-thread.mapper.ts` brandSummary + sourceContext + commercial/securement/fulfillment/settlement |
| Existing reusable API/read model | Collaboration detail is sufficient for MVP lighter context |
| Frontend change required | YES — Product copy; render Asset + commercial/execution summaries already on detail where useful |
| Backend change required | NO for MVP lighter context |
| Compatibility/deprecation impact | None |
| Privacy/security considerations | Do not invent Brand analytics or cross-campaign history |
| Required regression tests | Creator drawer shows Campaign/Asset/Brief without technical copy |
| Deferred owner/dependency | Extended Brand relationship/analytics — deferred |
| Remaining Product decision | How much commercial/execution detail belongs in the drawer vs execution hub |
| Recommended G1 scope | With Brand→Creator compose + COL-G0-011 |
| Stitch relevance | UNKNOWN |

### Field availability (Creator → Brand)

| Desired field | Available in Collab today? |
|---|---|
| Brand identity | Name only |
| Campaign / Asset / Brief | Yes on detail |
| Commercial / execution | Yes on detail |
| Extended Brand analytics | No — defer |

**Architecture note:** Prefer composing existing Collaboration detail over FE multi-fetch of public media kit for Brand-in-workspace context. Dedicated Brand-auth counterpart read only when Product authorizes history/richer profile.

---

## 5. Creator bank ownership / cutover (COL-G0-012)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-012 |
| Confirmed root cause | Creator Payouts UI posts bank details through Collaboration (`POST /collaboration/creator/bank-details`). Settings/Payout already has GET/POST payouts bank APIs writing the same `CreatorBankDetails` table with different semantics (always PENDING + creates `CreatorSettlementProfile`). Collab bank write can leave securement stuck in `AWAITING_PAYOUT_DETAILS` because negotiation prerequisite checks settlement profile existence, not bank row alone. Securement UI already deep-links Settings. |
| Canonical owner | Creator Settings / Payout |
| Current owner(s) | Settings/Payout **and** Collaboration bank endpoint; Payouts FE uses Collab client |
| Ownership violation | Collaboration still exposes/writes bank truth; Payouts mutates via Collab instead of Settings |
| Exact frontend files | `features/creator-payouts/components/CreatorBankDetailsDrawer.tsx`; `features/collaboration/api/collaboration-client.ts` (`upsertCreatorBankDetails`); Securement handoff already links Settings (`CollaborationExecutionHub.tsx`, `SecurementPanel.tsx`) |
| Exact backend files/services | Collab: `collaboration.controller.ts` bank-details; `collaboration-creator-profile.service.ts` upsertBankDetails. Settings: `creator-settings.controller.ts` payouts bank; `creator-settings.service.ts`. Prerequisite: `collaboration-negotiation.service.ts` (`AWAITING_PAYOUT_DETAILS`). Model: `CreatorBankDetails` in Prisma |
| Existing reusable API/read model | Settings/Payout R/W is complete; Collab consumes prerequisite state already |
| Frontend change required | YES — Payouts drawer → Settings client; remove Collab bank client use from Payouts |
| Backend change required | YES eventually — deprecate/remove Collab `POST creator/bank-details` after FE cutover. Do **not** move bank ownership into Collaboration |
| Compatibility/deprecation impact | Keep BE Collab endpoint temporarily until FE cutover + confirm no external clients; then retire |
| Privacy/security considerations | Preserve Settings workspace/role gates; masking behavior on reads |
| Required regression tests | Settings save → settlement profile present → manual-rail Collab leaves `AWAITING_PAYOUT_DETAILS`; old Collab path documented as defective until removed; Payouts hub status after Settings PENDING vs old VERIFIED/SUSPENDED path |
| Deferred owner/dependency | None for cutover direction |
| Remaining Product decision | None on ownership direction (already frozen). Timing of BE endpoint retirement after FE cutover is engineering |
| Recommended G1 scope | FE cutover first; BE deprecation second |
| Stitch relevance | NO |

**Canonical direction remains:** Settings/Payout owns Creator bank truth. Collaboration consumes prerequisite state or links to Settings/Payout.

---

## 6. Settlement / Payout-Escrow boundary (COL-G0-022)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-022 |
| Confirmed root cause | Classification **DEFERRED_OWNER** remains correct. Collaboration owns entitlement/resolution and settlement projection. Money-movement gateway intentionally returns `SETTLEMENT_EXECUTION_OWNER_UNAVAILABLE` / retryable failure and does not advance entitlement falsely. FE SettlementCard states entitlements are separate from execution and can show pending/blocked. No hidden FE tranche/payout arithmetic found (advance % displayed from BE projection only). |
| Canonical owner | Payout/Escrow for money movement; Collaboration for entitlement/resolution |
| Current owner(s) | Collaboration projection + deferred settlement gateway stub |
| Ownership violation | None while adapter unavailable |
| Exact frontend files | `components/publishing/SettlementCard.tsx`; related resolution presentation |
| Exact backend files/services | `collaboration-settlement.gateway.ts`; settlement service request path |
| Existing reusable API/read model | Settlement/resolution projection on detail |
| Frontend change required | NO for adapter. Keep truthful pending/blocked/eligible ≠ paid copy |
| Backend change required | YES only in external Payout/Escrow adapter task — not G0.2B Collab FE |
| Compatibility/deprecation impact | None now |
| Privacy/security considerations | Do not imply paid from entitlement alone |
| Required regression tests | When adapter arrives: entitlement unchanged until confirm; ELIGIBLE ≠ paid; BLOCKED/PENDING visible; zero-leg path |
| Deferred owner/dependency | **Payout/Escrow settlement execution adapter** |
| Remaining Product decision | None for ownership split |
| Recommended G1 scope | Not a Collaboration FE implementation slice; remain DEFERRED_OWNER |
| Stitch relevance | NO |

---

## 7. Direct-G1 findings register

Do not deeply reinvestigate unless ownership evidence changes.

### COL-G0-008 — Creator cancellation

| Field | Record |
|---|---|
| Confirmed | Backend + client exist; UI presenter missing |
| Exact FE | `api/collaboration-client.ts` (`cancelCollaborationByCreator`); `utils/collaboration-capabilities.ts` maps `CancelCollaborationByCreator`; `CollaborationExecutionHub.tsx` wires Brand `end` but never Creator cancel |
| Exact BE | `POST threads/:id/cancel-by-creator` → `CollaborationExceptionService.cancelByCreator` |
| Frontend change required | YES — capability-driven confirmation/action |
| Backend change required | NO |
| Recommended G1 scope | Capability-driven Creator cancel confirmation |
| Stitch relevance | UNKNOWN |

### COL-G0-011 — Counterpart drawer technical copy

| Field | Record |
|---|---|
| Confirmed | Users see “dedicated Brand-scoped endpoint” / “dedicated canonical endpoint” |
| Exact FE | `CreatorContextDrawer.tsx`; `BrandContextDrawer.tsx` |
| Backend change required | NO |
| Frontend change required | YES — Product empty/unavailable language |
| Recommended G1 scope | With COL-G0-010 compose/copy cluster |
| Stitch relevance | NO |

---

## 8. Remaining authority / Product decisions

| Topic | Status |
|---|---|
| Admin / unknown never defaults to Brand | Frozen in G0.2B §1 (G1 implements with COL-G0-001) |
| Deep-link unavailable copy | Frozen in G0.2B §1 (G1 implements with COL-G0-002) |
| No appliedAt projection unless proven needed | Frozen in G0.2B §1 (G0.2A COL-G0-003) |
| COL-G0-009 issue categories vs description-only | **OPEN** — Product must choose |
| COL-G0-010 MVP drawer contents / later history DTO | **OPEN** for history authorization; MVP compose is engineering |
| COL-G0-012 bank ownership | Closed — Settings/Payout |
| COL-G0-022 settlement adapter | Deferred owner — no Product ownership conflict |
| Message lifecycle (from G0.2A) | Accepted provisional; implementation later |

---

## 9. Recommended G1 grouping (from G0.2B)

1. **Fulfillment honesty** — COL-G0-009 (after Product taxonomy decision or description-only freeze)
2. **Counterpart UX** — COL-G0-010 compose existing detail + COL-G0-011 Product copy
3. **Bank cutover** — COL-G0-012 FE → Settings client, then BE Collab bank endpoint deprecation
4. **Creator cancel presenter** — COL-G0-008
5. **Settlement adapter** — COL-G0-022 remains DEFERRED_OWNER (external Payout/Escrow task)

Carry forward G0.2A groups unchanged for access/deep-link/read-validation/env/tests.

---

## 10. G0.2B completion assessment

- Product freezes for Admin, deep-link copy, and inbox identity recorded
- COL-G0-009 / 010 / 012 / 022 ownership questions answered with FE/BE evidence
- COL-G0-008 / 011 recorded for Direct-G1 so they are not lost
- No taxonomy, history data, bank move, or settlement adapter invented
- No runtime/CSS/Prisma/config/Stitch changes in this task
- Stops before G0.2C, G0.3, and G1
