# G1C — Discovery, Applicants, and Collaboration cutover acceptance

## Supervisor decision

```text
G1C ACCEPTED WITH DEBT
```

## Accepted boundary

- Discovery is consumed as a separate recommendation projection. With no authoritative recommendation provider configured, it returns a truthful unavailable/empty state and never falls back to legacy prospects.
- `CampaignApplication` is an additive canonical decision aggregate tied to an explicit canonical Brief and Campaign. Brand decisions apply only to submitted canonical Applications.
- An Application may carry an optional reference to an existing independent Collaboration. Accepting an Application does not create a Collaboration or invent commercial, creator, or lifecycle data.
- The Campaign Page replaces the legacy operational pipeline workspace with Discovery and Application consumption. It exposes no legacy pipeline action.
- Legacy pipeline reads remain intact for bounded compatibility. Every legacy pipeline mutation endpoint now rejects before it reaches the legacy service.
- No Application/Collaboration lineage is inferred or backfilled. No Create Campaign, Collaboration lifecycle, Reporting, or G1D lifecycle/readiness work was changed.

## Evidence

| Check | Result |
|---|---|
| Backend G1C focused tests | PASS — 5/5 |
| Backend G1A regression | PASS — 5/5 |
| Backend G1B regression | PASS — 6/6 |
| Backend typecheck/build | PASS |
| Frontend typecheck/scoped lint | PASS |
| Frontend production build | PASS using the short workspace mapping; existing chunk-size warning only |
| Prisma validate/generate | PASS against ephemeral `127.0.0.1:5432/creator_shop_acceptance` URL |
| Migration applied / database mutated | NO |
| Diff whitespace check | PASS |

Frontend G1C focused tests are authored. The managed Windows Vite/Vitest path resolver still fails when it normalizes the mapped test path back to its denied ancestor; this is the retained runner debt, not an assertion failure.

## Retained debt

1. `G1C_RUNTIME_SCHEMA_ACCEPTANCE_REQUIRED`: G1A/G1B/G1C migrations have not been applied to the frozen acceptance database. End-to-end schema runtime verification requires a disposable or separately authorized migrated database.
2. `G1C_FRONTEND_TEST_RUNNER_ENVIRONMENT_DEBT`: the frontend focused test runner remains unable to load source after managed sandbox path normalization. Frontend typecheck, scoped lint, and production build pass.
3. Existing G1A/G1B validation debts and `DEPLOYED_DATA_EVIDENCE_REQUIRED` remain open for consolidated G1 acceptance.

## Repository state

```text
Frontend accepted G1C source checkpoint: 49b2d34ca7f48b0701ed0adf235661862344e4fd
Backend accepted G1C source checkpoint: 471d78bbd651ffadb1afbf13cf921f11214feef0
G1C implementation: immutable committed checkpoints
Merged: NO
Deployed: NO
Stitch invoked: NO
```

## Gate conclusion

G1C is accepted with bounded validation debt. G1D was not generated or executed in this package.
