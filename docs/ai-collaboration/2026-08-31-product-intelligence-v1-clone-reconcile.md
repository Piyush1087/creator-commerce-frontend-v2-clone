# Product Intelligence V1 clone reconcile (frontend)

Date: 2026-08-31
Branch: `feature/brand-center-v2-integration` (from origin `development`)
Frozen source: clone `development` @ `6bc9659ec87d9b960caaf3c6314e0f4da7b2596f`

## Source of truth

- Executable Product Intelligence UI: frozen clone SHA above
- Product/architecture authority: `dummy_tcs` main @ `677a6333d143d02a715274ee9bed42ade96808b3`
- Continuation of Brand Centre v1 already on origin `development` (PR #19; handoff SHA `d89810c`)
- Do not rerun Stitch or redesign the accepted Offering experience

## Placement

- Feature: `src/features/brand-centre/` (client, schemas, queries, Offering list/detail)
- Pages: `/brand-centre/offerings`, `/brand-centre/offerings/:offeringId`
- Discovery API: `GET /api/v1/brand-centre/offerings` — not `GET /api/v1/brand-centre/dna/offerings`

## Runtime invariants

- Three Product processor/Object states stay section-scoped
- Stale current remains visible
- Candidate/conflict must not replace current
- Manual price save refetches backend canonical result
