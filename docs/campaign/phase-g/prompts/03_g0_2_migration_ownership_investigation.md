# G0.2 — Migration and ownership investigation

## Task

Investigate CAM-G0-001, CAM-G0-002, and CAM-G0-003 only. Do not implement a migration, cutover, backfill, schema change, or endpoint removal.

## Accepted baselines

- Canonical: `dummy_tcs` `3bc6457f99b24e1ef5767e5c80136f9b4c55f861`
- Frontend: `7e5750240c554aca6e651c31de371a8bd25ec3dc` on `phase-g/campaign-page-g0-audit`
- Backend: `5bce1f948e23774f16c7f2c65a309cc4e0a7fe71` on `main`

## Frozen Product decision

Hybrid canonical cutover: all new writes use canonical Campaign, Campaign Asset, Brief, Application, and independent Collaboration ownership. Do not destructively retire legacy data. Backfill only deterministic records; otherwise retain a bounded, non-authoritative historical read-only projection. An active non-terminal record with unsafe canonical reconstruction is an `ACTIVE_MIGRATION_BLOCKER`.

## Required investigation

Establish legacy populations, active/terminal counts, counterpart/linkage coverage, legacy read/write paths, safe backfill candidates, historical-only candidates, active blockers, affected frontend/backend surfaces, and existing compatibility projections. Record unavailable population evidence as an environment blocker; never infer counts.

## Output and disposition

Write `03_g0_2_migration_ownership_investigation.md`. Permitted result: `ACCEPTED_WITH_DEBT` only if live population evidence is available; otherwise `BLOCKED_ENVIRONMENT`. Stop for Product only when exact active migration blockers are proven.
