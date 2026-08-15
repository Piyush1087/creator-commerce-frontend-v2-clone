# Consolidated G1 functional acceptance

## Final rerun Supervisor decision

```text
CONSOLIDATED G1 ACCEPTED
```

All three bounded findings are closed. The five-file host suite passes 9/9 tests, and authenticated 390×844 F6C Brand runtime acceptance passes against `creator_shop_g1_clean_acceptance`. Final accepted checkpoints are frontend `e00f383b4bfb1181a42d31f16e26ce23e5797006` and backend `0f2c6c7b659d7305d36bd2ee0775973494d5a95e`. G2 is eligible but has not been executed; Stitch remains uninvoked.

## Historical initial Supervisor decision

## Supervisor decision

```text
CONSOLIDATED G1 NOT ACCEPTED
```

The integrated G1A–G1E authority and runtime cutover are sound, but two mandatory G1 functional scenarios remain absent from the deployable Campaign Page. G2 is not eligible.

## Integrated authority evidence

| Boundary | Result | Evidence |
|---|---|---|
| Campaign Asset | PASS | Explicit Brand Centre selection; no candidate-count inference; ownership enforcement; canonical projection; reconciliation-required path |
| Brief/Deliverable | PASS | Exact Campaign Asset ownership; deliverable-grain create/read/update; no legacy Brief write |
| Discovery | PASS / DEFERRED_OWNER | Truthful unavailable/empty projection; no legacy prospect authority or fabricated recommendations |
| Application | PASS | Canonical Application list/decision; acceptance does not create Collaboration |
| Collaboration | PASS | Independent Collaboration reference boundary; no inferred lineage or legacy pipeline mutation |
| Lifecycle/readiness | PASS | Backend-authored capabilities/readiness; LIVE readiness loss does not demote lifecycle |
| Reporting | PASS / DEFERRED_OWNER | Truthful unavailable projection; no legacy snapshot authority or invented metrics |
| Compatibility | PASS | Historical legacy presentation is read-only; canonical operational controls remain separate |

## Executed validation

| Check | Result |
|---|---|
| Clean migration chain from empty | PASS — 36 repository migrations; history aligned |
| Migrated-schema runtime acceptance | PASS — G1A–G1D authority paths |
| Legacy write count freeze | PASS — Products 1→1, Briefs 0→0, pipeline 0→0 |
| Brand/Creator local auth | PASS — Brand plus two Creator identities |
| Frontend host Vitest | PASS — 3 files, 6/6 tests |
| Frontend typecheck/build/scoped lint | PASS |
| Backend build | PASS |
| Backend Prisma validate/generate | PASS against `creator_shop_g1_clean_acceptance` |
| Backend focused suites | Previously PASS — G1A 6/6, G1B 6/6, G1C 5/5; consolidated rerun blocked by the known Codex path resolver |
| Backend scoped lint | PASS |
| External provider calls | NONE |
| Frozen `creator_shop_acceptance` mutation | NO |

## State and responsive review

| Scenario | Result |
|---|---|
| Initial loading | PASS |
| Canonical ready / not-ready | PASS |
| Reconciliation-required | PASS |
| Terminal historical/read-only | PASS |
| No Assets / Briefs / Applications | PASS |
| Discovery and Reporting unavailable | PASS |
| Command error | PASS |
| Primary read error | PARTIAL — presented without retry action |
| Retry/recovery | FAIL — primary Campaign shell read cannot be retried in place |
| Workspace visibility/availability/priority | PASS |
| Selected workspace persistence | FAIL — no workspace selection is implemented or restored on re-entry |
| Mobile/responsive source | PASS — breakpoints, flexible grids, and overflow guards exist |
| Mobile runtime interaction | NOT EXECUTED |

## Blocking findings

1. `CAM-G1-CONS-001` — `STATE_MODEL_GAP` (P1): the Campaign read failure offers navigation away but no retry/recovery action.
2. `CAM-G1-CONS-002` — `HYDRATION_GAP` / `FRONTEND_INTEGRATION_DEFECT` (P1): backend workspace order/availability is summarized, but selected workspace state is neither implemented nor persisted/reconstructed.
3. `CAM-G1-CONS-003` — `VALIDATION_DEBT` (P2): authenticated mobile runtime interaction has not executed.

These findings require a bounded G1E repair and deterministic coverage, not new Campaign authority. No G2, Stitch, merge, or deployment action is authorized.

## Retained non-blocking items

- `DEPLOYED_DATA_EVIDENCE_REQUIRED`; destructive migration/backfill remains deferred.
- Reporting provider integration is `DEFERRED_OWNER`; truthful unavailable behavior is accepted.
- Create Campaign remains unchanged and outside this repair.

## Bounded G1E repair rerun

The historical `CONSOLIDATED G1 NOT ACCEPTED` decision above is preserved. The rerun closes the source findings as follows:

| Finding | Rerun status | Evidence |
|---|---|---|
| `CAM-G1-CONS-001` | SOURCE FIXED; execution pending | Primary authoritative Campaign read exposes in-place Retry and deterministic coverage exercises reject → retry → resolved Campaign |
| `CAM-G1-CONS-002` | SOURCE FIXED; execution pending | Backend projection orders/limits availability; URL-backed selection restores valid state and falls back from invalid/unavailable state; selected workspace changes actual composition |
| `CAM-G1-CONS-003` | OPEN | 390×844 runtime launched, but the available authenticated session has no seeded BrandProfile and cannot access the F6C Campaign fixtures |

Static validation passes: frontend typecheck, production build, scoped lint, and diff validation. The normal-host Vitest rerun remains required because the Codex-local resolver cannot load the repository Vitest config:

```powershell
& .\node_modules\.bin\vitest.cmd run .\src\pages\brand\uce\BrandUceCampaignDetailPage.test.tsx .\src\features\uce\components\CampaignReadinessWorkspaceCard.test.tsx .\src\features\uce\components\CampaignAssetReconciliationCard.test.tsx .\src\features\uce\components\CanonicalCampaignBriefsCard.test.tsx .\src\features\uce\components\CampaignParticipationCard.test.tsx
```

Rerun decision: `CONSOLIDATED G1 NOT ACCEPTED`. G2 remains ineligible until the five focused files pass on the normal host and authenticated mobile Campaign interaction is evidenced using the seeded F6C Brand identity against `creator_shop_g1_clean_acceptance`.

## Final rerun closure

| Finding | Final status | Closing evidence |
|---|---|---|
| `CAM-G1-CONS-001` | CLOSED | Host Vitest deterministic reject → Retry → authoritative Campaign recovery passes |
| `CAM-G1-CONS-002` | CLOSED | Host Vitest selection, composition, persistence/restoration, and fallback coverage passes; authenticated mobile interaction confirms the flow |
| `CAM-G1-CONS-003` | CLOSED | Fresh F6C Brand session at 390×844 passes Campaign access, workspace interaction/re-entry/fallback, readiness/lifecycle access, truthful Reporting unavailability, overflow, and AppShell navigation checks |

Final decision: `CONSOLIDATED G1 ACCEPTED`.
