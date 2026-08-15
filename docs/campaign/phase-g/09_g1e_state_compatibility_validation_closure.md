# G1E closure acceptance

```text
G1E ACCEPTED WITH DEBT
```

State/compatibility source evidence is accepted: canonical readiness/workspace projection, reconciliation/terminal safeguards, legacy write cutoffs, and Reporting-unavailable behavior remain intact. Backend regressions pass G1A 6/6, G1B 6/6, G1C 5/5; backend and frontend typechecks/builds pass.

Migrated-schema runtime debt is closed. A clean, disposable `creator_shop_g1_clean_acceptance` database was built from empty by the repository migration chain (36 migrations, including G1A–G1C), with aligned Prisma history. The local-only, idempotent F6C fixture was run twice without duplication (3 users, 1 organization, 1 BrandProfile, 1 Offering, 2 CreatorProfiles, 4 Campaigns, 1 Application, 0 Collaborations). Brand, primary Creator, and secondary Creator stub-OTP authentication passed. G1A–G1D runtime acceptance passed, including explicit Asset selection, canonical Brief/deliverable creation and update, Application acceptance without Collaboration creation, truthful Discovery/Reporting unavailable projections, terminal projection, and LIVE readiness loss without lifecycle demotion. Legacy counts remained frozen: Products 1→1, Briefs 0→0, pipeline 0→0. No external calls were made; `creator_shop_acceptance` was not mutated.

The frontend runner debt is closed by normal host PowerShell evidence: all 3 authored G1 focused Vitest files pass, 6/6 tests. The subsequent accessibility and test-isolation failures were corrected without weakening explicit Campaign Asset selection or introducing Asset inference.

Post-package consolidated review found that G1E evidence did not cover two mandatory consolidated scenarios: selected-workspace persistence/orchestration and a primary Campaign read-error retry action. The historical G1E Supervisor decision remains recorded, but these gaps prevent consolidated G1 acceptance and require a bounded G1E repair package.

Reporting provider integration is `DEFERRED_OWNER`; Campaign continues its truthful unavailable projection and does not consume legacy reporting snapshots.

## Bounded consolidated-repair evidence

The bounded repair implements the two missing source behaviors without changing authority: the primary authoritative Campaign read now exposes in-place retry, and backend-projected workspaces now drive actual Campaign Page composition. Workspace selection is persisted in `?workspace=`, restored when valid, and deterministically falls back to the highest-priority available backend workspace when absent, invalid, or unavailable. Unavailable workspaces remain non-operable; no legacy tabs or authority were introduced.

Deterministic frontend coverage was added for retry/recovery, backend priority ordering, composition switching, URL persistence/restoration, and unavailable-selection fallback. Frontend typecheck, production build, scoped lint, and `git diff --check` pass. The Codex-local Vitest resolver remains unable to load `vitest.config.ts`; the new focused files therefore require the normal-host rerun recorded in the consolidated artifact.

Authenticated mobile runtime was attempted at 390×844 against the migrated disposable runtime. The available authenticated browser session belongs to an organization without the F6C seeded BrandProfile and the authoritative list correctly returned `Brand profile not found for this organization`; it cannot supply valid Campaign interaction evidence. This is an evidence/session-fixture gap, not a Product-authority conflict and not grounds to weaken ownership enforcement.

## Final repair validation closure

Normal host PowerShell executed all five bounded-G1E frontend files: 5/5 files and 9/9 tests passed. `CAM-G1-CONS-001` and `CAM-G1-CONS-002` deterministic coverage is closed.

A new browser session authenticated the seeded F6C Brand using local stub OTP against `creator_shop_g1_clean_acceptance`. At the 390×844 acceptance viewport the Campaign list and ready fixture `10000000-0000-4000-8000-000000000011` loaded; Discovery was the backend-priority default; Applications selection changed actual composition and persisted as `?workspace=applications`; re-entry restored it; an invalid/unavailable `?workspace=reporting` fell back to Discovery; lifecycle and readiness controls remained accessible; Reporting remained disabled with truthful unavailable copy; document and body widths matched the usable viewport; and the AppShell menu opened and closed. `CAM-G1-CONS-003` is closed.

Final immutable source checkpoints: frontend `e00f383b4bfb1181a42d31f16e26ce23e5797006`; backend `0f2c6c7b659d7305d36bd2ee0775973494d5a95e`.
