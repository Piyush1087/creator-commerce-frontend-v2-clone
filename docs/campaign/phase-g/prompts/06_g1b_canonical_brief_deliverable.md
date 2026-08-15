# G1B — Canonical Brief and deliverable ownership

## Task

Implement the canonical Campaign Brief boundary on top of the accepted G1A Campaign Asset authority. This package may begin only from the reviewed G1A working trees and must preserve all G1A reconciliation safeguards.

## Baselines

- Canonical specification: `3bc6457f99b24e1ef5767e5c80136f9b4c55f861`
- Frontend accepted G1A source checkpoint: `b81f600d9a55a83ead8b423d379996b3864810fe`, branch `phase-g/campaign-page-g0-audit`
- Backend accepted G1A source checkpoint: `694b1c75c29298738c8b20ad03b35d05a4175138`, branch `phase-g/g1a-canonical-asset`
- Governing acceptance: `docs/campaign/phase-g/05_g1a_canonical_asset_reconciliation.md`

## Frozen authority

- New Campaign Page Brief writes use canonical Brief authority and belong to a proven canonical Campaign Asset.
- Do not infer Asset ownership, deliverables, creative requirements, publishing applicability, Application references, or Collaboration lineage from legacy records.
- Existing legacy Brief data/endpoints remain available only through bounded compatibility and must not override canonical records.
- An active Campaign whose Brief cannot be transferred deterministically remains reconciliation-required; do not fabricate readiness.
- Do not create Application or Collaboration lineage in this package.

## Required implementation

1. Reconcile the deployed schema with the canonical Brief model and implement only the additive/reversible schema changes required for Campaign Asset ownership and deterministic deliverable representation.
2. Add Brand-scoped backend contracts for canonical Brief create/read/update within an owned canonical Campaign Asset. Reject cross-Campaign, cross-Brand, inactive/reconciliation-blocked, or ambiguous ownership.
3. Project canonical Brief readiness and missing-requirement state from the backend. The frontend must render backend authority and must not infer readiness from the presence of legacy fields.
4. Replace Campaign Page legacy Brief creation/edit entry points with the canonical Brief path. Preserve bounded read-only presentation for historical legacy-only Briefs, without technical terminology in Brand-facing copy.
5. Preserve G1A explicit Asset selection and activation blocking. Do not restore legacy Product or Brief writes through the Campaign Page.
6. Add focused deterministic tests for ownership, explicit Asset association, required deliverable semantics, legacy read-only compatibility, and rejection of fabricated readiness.

## Non-goals

- No legacy mass backfill, destructive retirement, or database mutation during source validation.
- No Application, shortlist, independent Collaboration, commercial, lifecycle, or payout implementation.
- No Create Campaign changes.
- No Stitch, G2, merge, deploy, or provider calls.

## Verification

- Prisma validate and generate using only the approved ephemeral local acceptance `DATABASE_URL`; verify and report only host, port, and database name first.
- Do not run Prisma migrate, deploy, db push, reset, or seed, and do not apply migrations to `creator_shop_acceptance` without separate authorization.
- Run focused backend tests, relevant Campaign regressions, backend typecheck/build, frontend typecheck/focused tests/build, scoped lint, and diff/schema review.
- Preserve the G1A validation debts unless independently cleared with truthful evidence.

## Required artifact and Supervisor gate

Produce `docs/campaign/phase-g/06_g1b_canonical_brief_deliverable.md` with exact implementation evidence, checks, debt, repository state, and one decision: `G1B ACCEPTED`, `G1B ACCEPTED WITH DEBT`, or `G1B NOT ACCEPTED`. Update `00_run_state.md`. Do not advance if new Product semantics, ownership ambiguity, nondeterministic migration, or a failure makes the next package unsafe.
