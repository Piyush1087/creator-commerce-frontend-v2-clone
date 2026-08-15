# G1B — Canonical Brief and deliverable acceptance

## Supervisor decision

```text
G1B ACCEPTED WITH DEBT
```

The reviewed source satisfies the frozen G1B ownership boundary. No Product inference, destructive migration, Application creation, or Collaboration creation was introduced.

## Accepted implementation

- Additive `CanonicalCampaignBrief` and `CanonicalBriefDeliverable` persistence requires every Brief to belong to one existing Campaign Asset.
- Deliverables are authoritative rows with explicit format, positive quantity, creative requirements, and publishing applicability supplied by the Brand.
- Brand-scoped create/read/update APIs validate Campaign ownership, active Asset ownership, and terminal read-only behavior.
- The Campaign shell projects canonical Briefs, deliverables, backend-derived readiness, and write capabilities.
- The Campaign Page requires explicit Asset selection before Brief creation and submits the exact selected Asset; it does not infer ownership from candidate count or legacy data.
- Existing historical Briefs remain visible and are marked read-only. Legacy Brief create/update/delete endpoints remain present but reject mutation with Brand-facing copy.
- Campaign activation readiness now counts active canonical Assets and canonical Briefs rather than legacy Product/Brief records.
- No Application or Collaboration lineage is created or inferred.

## Evidence

| Check | Result |
|---|---|
| Backend focused G1B tests | PASS — 6/6 |
| Backend G1A regression | PASS — 5/5 |
| Backend typecheck | PASS |
| Backend build | PASS |
| Frontend typecheck | PASS |
| Frontend scoped lint | PASS |
| New backend source scoped lint | PASS |
| Frontend production build | PASS once on the G1B implementation; repeat after the final presentation-only legacy-button guard hit the managed esbuild path denial |
| Prisma validate/generate | PASS against ephemeral `127.0.0.1:5432/creator_shop_acceptance` URL |
| Migration applied / database mutated | NO |
| Diff whitespace check | PASS |

Focused backend coverage proves exact Asset association, cross-Campaign/inactive Asset rejection, terminal read-only behavior, Campaign-owned reads, readiness, and legacy write rejection. Frontend tests cover blank initial Asset ownership, exact Asset submission with explicit deliverable semantics, and safe Brand-facing unavailable presentation.

## Retained debt

1. `G1B_RUNTIME_SCHEMA_ACCEPTANCE_REQUIRED`: neither G1A nor G1B migrations were applied to the frozen acceptance database; schema-backed end-to-end runtime acceptance remains pending explicit environment authorization.
2. `G1B_FRONTEND_TEST_RUNNER_ENVIRONMENT_DEBT`: Vite/Vitest intermittently cannot resolve the workspace config because the managed Windows sandbox denies an ancestor traversal. The G1B frontend suite is authored, typecheck and scoped lint pass, and the production build passed once during this Worker package.
3. G1A retained debts and `DEPLOYED_DATA_EVIDENCE_REQUIRED` remain open until consolidated G1 acceptance.

These are validation debts, not authority conflicts, and do not authorize database mutation.

## Repository state

```text
Frontend accepted G1B source checkpoint: 59fe932f71441ec4449ba83ea614a698561f1795
Backend accepted G1B source checkpoint: a3fa13d40c5cc5b9b4e5f09c59f38a1020790ff9
G1B implementation: immutable committed checkpoints
Merged: NO
Deployed: NO
Stitch invoked: NO
```

## Gate conclusion

G1B is accepted with bounded debt. G1C was not generated or executed in this package.
