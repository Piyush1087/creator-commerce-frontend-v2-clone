# Collaboration Phase G — G0.2A Access, Identity & Read-Integrity

**Status:** COMPLETE (source investigation only)  
**Captured:** 2026-08-14  
**Scope:** G0.2A ONLY — no runtime source changes, no Stitch, no merge, no deploy  
**Inputs:** `00_baseline.md`, `01_g0_reality_audit.md`, Product G0.2A prompt  

Baselines remain those frozen in G0.0 (developer FE/BE with clone evidence SHAs;
canonical `dummy_tcs@b4ae5bd`).

---

## 1. COL-G0-005 — G0-discovered canonical hotfix traceability

Treat as: **G0-DISCOVERED CANONICAL HOTFIX — PENDING G1 ACCEPTANCE**  
Do not modify further in G0.2.

| Field | Value |
|---|---|
| Repository | `creator-commerce-backend-v2` (developer-owned) |
| Branch | `feature/collab-clone-reconcile-be` |
| Pre-fix SHA | `0385c8a06abed604402621c1a3e94ee1c4e6d0e6` |
| Post-fix SHA | `efffc2701a61bbd49748a28608d54f927ee44a4e` |
| Files changed | `src/features/brand-uce/dto/brand-uce-pipeline.dto.ts`; `src/features/brand-uce/services/brand-uce-pipeline.service.ts`; `src/features/brand-uce/services/campaign-application.service.ts` |
| Behavior before | Pipeline approve silently defaulted missing `deliverable_publishing_applicability` to every Brief deliverable with `publishingRequired: true`. Developer Applications approve also auto-called pipeline approve without that mapping. |
| Behavior after | `deliverable_publishing_applicability` is required (`ArrayMinSize(1)`). Pipeline maps only explicit values. Applications approve marks Application APPROVED only; Collaboration provision stays on pipeline approve with explicit mapping. |
| Canonical justification | Frozen BE clone `13ce652f432560a91dde1f75ca9a21dfa76d054f` provisioning contract; silent default was a developer-reconcile deviation. |
| Tests/checks run | Targeted Nest compile of changed brand-uce paths during fix session; full suite not re-run for this G0.2A doc-only task. |
| Merge/deployment status | Pushed to `origin` and `piyush` as branch tip. **Not merged. Not deployed.** Pending G1 acceptance. |

---

## 2. Product decision — Brand route (COL-G0-017 resolved)

**Frozen Product decision (G0.2A):**

| Route | Role |
|---|---|
| `/brand/collaborations` | Operational Brand Collaboration |
| `/creator/collaborations` | Operational Creator Collaboration |
| `/brand/collaboration-page` | **Not** a second operational Collaboration route |

Evidence of current ownership of `/brand/collaboration-page`:

- Route: `src/routes/app-routes.tsx` (Brand authenticated area)
- Page: `src/pages/brand/collaboration/brand-collaboration-page.tsx` — public Brand landing/preview via Brand Centre hooks
- Shell label: “Brand page” in `src/layouts/app-shell/sidebar-items.ts`

**Disposition:** Preserve separate public Brand preview/landing ownership for now.
Flag later retirement/redirect only if Product later collapses Brand page IA.
**Do not rewire routes in G0.2.**

COL-G0-017 classification updates from open `AUTHORITY_CONFLICT` to
**RESOLVED BY PRODUCT DECISION** (implementation deferred; no G0.2 code change).

---

## 3. Product decision — Message lifecycle (authority assessment)

**Provisional Product policy (G0.2A):**

| Lifecycle | History | Sending |
|---|---|---|
| ACTIVE | visible | may be available |
| PAUSED | visible | disabled |
| COMPLETED | visible | disabled |
| CANCELLED | visible | disabled |
| TERMINATED | visible | disabled |

Backend `availableActions` remains the executable authority for whether Send is
offered.

### Canonical contradiction check

Frozen `dummy_tcs` `collaboration/backend/command_contract.md` §11
`PostCollaborationMessage` requires Brand/Creator access and appends a USER
message. It does **not** explicitly authorize messaging in non-ACTIVE
lifecycles, nor does it forbid Product’s provisional disable rule.

**AUTHORITY_CONFLICT against frozen contracts:** NO  
Product provisional decision is accepted for G0.2A / G1 planning.

### Implementation vs Product provisional (current reality)

| Layer | Current behavior | Aligns with Product? |
|---|---|---|
| Backend `deriveAvailableActions` | Always seeds `PostCollaborationMessage` for every lifecycle, including COMPLETED/PAUSED/CANCELLED/TERMINATED and legacy rows (`collaboration-thread.mapper.ts` ~281–307) | NO |
| Backend message POST | Ownership-checked only; no lifecycle/`availableActions` gate (`collaboration.service.ts`) | NO |
| Frontend composer | Always enabled when a row is selected; ignores mapped message capability (`CollaborationWorkspace.tsx` composer; `collaboration-capabilities.ts` unused) | NO |
| Completed panel copy | States chat remains available | NO |

**G1 implication:** Align backend action derivation + POST rejection with Product
policy, then drive FE composer from `availableActions` (do not re-encode
lifecycle rules in the UI). Pause/resume command policy remains separately
deferred; PAUSED may be rare until Pause exists.

---

## 4. Finding investigations

### COL-G0-001 — Route / role access and unresolved-role Brand fallback

| Field | Finding |
|---|---|
| Confirmed root cause | Routes are token-gated only (`RequireAuth`). Session already carries `user.role`, but CollaborationWorkspace defaults unknown/null role to `"BRAND"`. Opposite-role users can mount the wrong path; backend still scopes list/detail. |
| Exact files/components | `src/shared/auth/require-auth.tsx`; `src/routes/app-routes.tsx`; `src/features/collaboration/components/CollaborationWorkspace.tsx` (role fallback); `src/shared/auth/auth-session.ts`; `src/shared/auth/user-role.ts`; `src/features/auth/constants.ts` (role→URL maps non-Creator to Brand); shell `sidebar-items.ts` (unknown role → empty nav, no Brand fallback) |
| Canonical authority | Auth session role for presentation routing; `CollaborationAccessService` / query scoping for data authority (unsupported role 403; wrong ownership 404) |
| Frontend fix required | YES — role-aware route/entry guard; remove Brand fallback; redirect known opposite roles; explicit unsupported-role / refresh-session for Admin/unknown |
| Backend fix required | NO for ownership (already authoritative). Optional later: clearer unsupported-role UX codes if Product wants distinguishable 403 vs empty inbox |
| Compatibility/migration impact | None for data. Admin users currently redirected toward Brand Collaboration URL helper — decide Admin presentation with Product if needed |
| Required regression tests | Brand session cannot mount Creator route (and reverse); unknown role never renders Brand workspace; backend 403/empty still respected |
| Remaining product decision | Admin Collaboration access presentation (if any) |
| Recommended G1 scope | FE route guard cluster with COL-G0-002 |
| Stitch relevance | NO |

---

### COL-G0-002 — Invalid/no-access deep-link fallback

| Field | Finding |
|---|---|
| Confirmed root cause | After inbox load, selection is `deepLink if in rows else current if in rows else rows[0]`. Detail is only fetched for the selected id. A requested id that is missing, unauthorized, or outside the first list page never gets a detail 404 — another Collaboration opens silently. |
| Exact files/components | `CollaborationWorkspace.tsx` selection logic (~28–48); query params `thread` preferred, legacy `collaboration` accepted; outbound legacy links still use `?collaboration=` from payouts/campaigns |
| Canonical authority | Detail GET + access service (owned → 200; missing/unauthorized → 404 without enumeration) |
| Frontend fix required | YES — when URL has an id, fetch detail first; on 404 show stable NOT_FOUND_OR_NO_ACCESS and keep URL; never select another row because inbox membership failed |
| Backend fix required | NO for access semantics. Optional: document that list is capped (default 50 / max 100, no cursor) so FE must not treat inbox membership as deep-link validity |
| Compatibility/migration impact | Keep accepting legacy `collaboration` query param while normalizing writes to `thread` |
| Required regression tests | Owned deep link; not-owned existing id; missing id; absent from first page; legacy query param; no silent `rows[0]` swap |
| Remaining product decision | Exact user-facing copy for not-found vs no-access (backend collapses both to 404) |
| Recommended G1 scope | Same FE deep-link/access cluster as COL-G0-001 |
| Stitch relevance | NO |

---

### COL-G0-003 — Inbox identity / Application cardinality

| Field | Finding |
|---|---|
| Confirmed root cause | Backend already projects campaign, campaignAsset, and brief on list rows. FE row UI renders counterpart name, snippet-or-campaign, lifecycle/stage, action label only — omitting brief/asset/handle/unread/time. Same creator+campaign rows can look identical. |
| Exact files/components | FE: `CollaborationWorkspace.tsx` inbox row (~58–64). BE projection: `collaboration-thread.mapper.ts` `projectCanonicalCollaborationThreadRow`; access include; types in `collaboration.types.ts`. Cardinality: unique nullable `sourceApplicationId`; provision from approved Application |
| Canonical authority | One Collaboration per approved Application; inbox identity must distinguish Application-origin lineage without exposing UUIDs |
| Frontend fix required | YES — render minimum hierarchy: counterpart (+ handle when present), campaign, brief title, asset name/type or thumbnail |
| Backend fix required | Usually NO for current fields. YES only if Product needs `appliedAt` / application label when brief+asset still collide — that field is not on the list projection today |
| Compatibility/migration impact | Legacy rows (`sourceApplicationId` null) may lack asset/application context; pair with COL-G0-013 bounded presentation |
| Required regression tests | Two Application-origin rows same campaign/creator show distinguishable non-ID labels; legacy reduced-context row does not invent identity |
| Remaining product decision | Whether to add applied-date label when brief/asset still collide |
| Recommended G1 scope | FE inbox identity presentation; optional small BE projection add-on if Product requires applied date |
| Stitch relevance | UNKNOWN — layout may wait for G2 composition; functional distinguishability is G1 |

---

### COL-G0-004 — Runtime validation of Collaboration HTTP read models

| Field | Finding |
|---|---|
| Confirmed root cause | Client asserts JSON to TS types (`as ...`). No Zod parse on list/detail/messages/command responses. Missing/invalid `publishingRequired` is falsy in Publishing UI → treated as “not required”. Zod is already a dependency but unused for Collaboration reads. |
| Exact files/components | `api/collaboration-client.ts` (`readJsonOrThrow`, assertions); `contracts/collaboration.contracts.ts`; `components/publishing/PublishingDeliverableCard.tsx`; `components/execution/CompletedPanel.tsx`; input-only `utils/collaboration-validation.ts` |
| Canonical authority | Backend mapper projects required persisted booleans/enums; FE must not invent semantic defaults at the read boundary |
| Frontend fix required | YES — Zod (or equivalent) read schemas for list, detail, messages; strict `publishingRequired: boolean`; invalid authoritative payload → explicit contract-error state |
| Backend fix required | NO for canonical mapper shape (already projects required boolean). COL-G0-005 already closed silent provisioning default |
| Compatibility/migration impact | Legacy rows may omit canonical deliverable/publishing graphs — schemas must allow documented legacy absence without coercing `publishingRequired` to false on canonical rows |
| Required regression tests | Fixture: missing `publishingRequired` fails parse; valid canonical detail passes; legacy compatibility fixture parses under explicit legacy branch |
| Remaining product decision | None for strict boolean on canonical rows |
| Recommended G1 scope | FE read-schema layer + safe failure UI; shares fixtures with COL-G0-013/020 |
| Stitch relevance | NO |

---

### COL-G0-013 — Canonical vs LEGACY_COMPATIBILITY projections

| Field | Finding |
|---|---|
| Confirmed root cause | BE marks `projectionSource=LEGACY_COMPATIBILITY` when `sourceApplicationId` is null (pre-foundation records). Lifecycle/stage/workflow are derived; commercial/deliverables may be null/empty; `legacyCompatibility` metadata lists `MISSING_SOURCE_APPLICATION`. FE declares the fields but never consumes them — legacy rows render as if canonical. |
| Exact files/components | BE: `collaboration-thread.mapper.ts` (`projectionSource`, legacy lifecycle/stage, `legacyCompatibility`, canonical thread/detail mappers); schema nullable `sourceApplicationId`; BE test `collaboration-read-model.mapper.test.ts` legacy case. FE: `contracts/collaboration.contracts.ts` fields unused by components |
| Canonical authority | Compatibility boundary is backend-owned; FE must not imply per-Deliverable canonical truth for compatibility rows |
| Frontend fix required | YES — detect `projectionSource` / `legacyCompatibility`; bounded read-only presentation; no debug jargon in product copy; suppress or clearly disable canonical execution that cannot be truthful |
| Backend fix required | NO to invent removal date. Optional telemetry already partially modeled via metadata |
| Compatibility/migration impact | Production migration / pre-foundation rows only as currently modeled. Do not invent a removal date |
| Required regression tests | Legacy fixture renders bounded UI; canonical fixture unchanged; actions not implied from empty deliverables |
| Remaining product decision | YES — exact product language for compatibility/migration rows (without “legacy/debug” wording); which execution surfaces stay hidden vs read-only |
| Recommended G1 scope | FE compatibility presentation + action gating; Product copy decision first |
| Stitch relevance | NO for semantics; visual treatment may follow G2 |

---

### COL-G0-015 — Production VITE_API_URL / Socket environment handling

| Field | Finding |
|---|---|
| Confirmed root cause | `env.ts`: blank/missing `VITE_API_URL` in production builds falls back HTTP+socket to `http://localhost:3000`. Dev HTTP uses same-origin proxy `""`; sockets always prefer configured URL or localhost. SST `sst.config.ts` injects prod/dev API URLs for standard deploys, so the main SST path is covered — but `npm run build` / alternate CI without env still embeds localhost silently. |
| Exact files/components | `src/shared/config/env.ts`; `collaboration-client.ts` / `collaboration-socket-client.ts`; `vite.config.ts` proxy; `sst.config.ts` environment block; `src/vite-env.d.ts` types URL as always present |
| Canonical authority | Deployment configuration ownership |
| Frontend fix required | YES — fail fast in production when API URL missing/invalid; keep localhost only for DEV |
| Backend fix required | NO |
| Compatibility/migration impact | None |
| Required regression tests | Unit: prod-mode missing URL throws; DEV blank HTTP stays proxy-safe |
| Remaining product decision | None |
| Recommended G1 scope | Small env hardening + build-time/check documentation for non-SST paths |
| Stitch relevance | NO |

---

### COL-G0-020 — Minimum deterministic frontend regression architecture

| Field | Finding |
|---|---|
| Confirmed root cause | FE package has no Vitest/Jest/Playwright/Testing Library, no test script, no `*.test.*` under Collaboration, no FE CI test job. Clone did not ship a FE automated-test harness. Zod is available for contract fixtures. |
| Exact files/components | `package.json` scripts/deps; `tsconfig.app.json` includes `src` only; `src/features/collaboration/**` |
| Canonical authority | N/A — engineering readiness for G1 gates |
| Frontend fix required | YES (architecture introduction in G1, not G0.2) |
| Backend fix required | NO (BE already has node tests for mappers/commands; FE should not depend on them for UI gates) |
| Compatibility/migration impact | None |
| Required regression tests (target set for G1 harness) | Brand vs Creator role routing; owned vs invalid deep link; canonical vs invalid read model; lifecycle send capability; stale aggregate/refetch; legacy compatibility row; terminal state; realtime degraded notice; per-Deliverable Publishing / `publishingRequired` |
| Remaining product decision | None |
| Recommended G1 scope | Smallest useful stack: **Vitest** (Vite-aligned) + pure Node tests for selection/capability helpers + Zod fixture tests; add Testing Library only when DOM assertions become necessary; defer Playwright |
| Stitch relevance | NO |

**G0.2 constraint honored:** no test framework added in this phase; recommendation only.

---

## 5. P0 risk summary (this cluster)

| ID | Risk | G1 urgency |
|---|---|---|
| COL-G0-001 | Wrong-role workspace mount + Brand fallback | P0 FE |
| COL-G0-002 | Silent open of another Collaboration on bad deep link | P0 FE |
| COL-G0-004 | Unvalidated reads; `publishingRequired` falsy default | P0 FE |
| COL-G0-015 | Non-SST prod build can embed localhost API | P0 FE/config |
| COL-G0-005 | Hotfix landed; still unmerged — pending G1 acceptance | Track |

Message-policy misalignment (always-on send) is Product-confirmed direction vs
clone implementation — treat as **P0/P1 backend+FE alignment** once G1 is
authorized for that cluster (may land in G0.2B/G1 messaging scope if Product
splits it).

---

## 6. Recommended G1 grouping (from G0.2A only)

1. **Access & deep-link integrity** — COL-G0-001, COL-G0-002 (+ NOT_FOUND_OR_NO_ACCESS UX)
2. **Read-contract integrity** — COL-G0-004 (+ publishingRequired safe failure)
3. **Inbox identity** — COL-G0-003 (FE first; optional BE appliedAt)
4. **Legacy compatibility presentation** — COL-G0-013 (needs Product copy decision)
5. **Environment hardening** — COL-G0-015
6. **Vitest + fixture harness** — COL-G0-020 underpinning the above
7. **Track separately** — COL-G0-005 hotfix acceptance on BE reconcile branch
8. **Track separately** — Message lifecycle Product policy vs BE `availableActions` / FE composer (accepted decision; implementation later)

Do not implement these in G0.2.

---

## 7. G0.2A completion assessment

- COL-G0-005 hotfix trail recorded; left unmodified
- COL-G0-017 Product route decision frozen and documented
- Message-policy provisional decision accepted; no frozen-contract AUTHORITY_CONFLICT; implementation gap recorded
- Seven assigned findings investigated with FE/BE evidence
- UNKNOWN values from G0.1 replaced where evidence permitted
- No runtime/CSS/Prisma/config/Stitch changes in this task
- Stops before G0.2B and G1
