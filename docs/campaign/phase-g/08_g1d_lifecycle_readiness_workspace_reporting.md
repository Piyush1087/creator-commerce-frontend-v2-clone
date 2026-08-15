# G1D — Lifecycle, readiness, workspace, and Reporting acceptance

## Supervisor decision

```text
G1D ACCEPTED WITH DEBT
```

Backend Campaign shell now authoritatively supplies lifecycle capabilities, canonical readiness, workspace projection, and a truthful Reporting-unavailable state. The Campaign Page consumes those backend fields; lifecycle toggle availability no longer derives from status in the frontend.

Readiness consumes active canonical Assets, canonical Briefs, and campaign budget. It does not use legacy Product/Brief/pipeline counts. A Campaign that is already ACTIVE remains ACTIVE if it later loses readiness; readiness instead disables activation/resume capability and reports missing requirements.

Workspace projection supplies Discovery, Applications, Collaborations, and Reporting visibility, priority, availability, counts, and unavailable copy. Reporting is unavailable rather than fabricated or sourced from legacy UCE snapshots.

## Evidence

| Check | Result |
|---|---|
| G1A/G1B/G1C backend regressions | PASS — 5/5, 6/6, 5/5 |
| Backend typecheck/build | PASS |
| Frontend typecheck/scoped lint | PASS |
| Frontend production build | PASS via short workspace mapping; existing chunk-size warning only |
| Prisma validate/generate | PASS; `127.0.0.1:5432/creator_shop_acceptance` verified |
| Migration applied / DB mutated | NO |

## Retained debt

- G1D focused deterministic backend/frontend coverage remains to be added/executed before consolidated G1 acceptance.
- Migrated-schema runtime acceptance remains deferred; no Phase G migration was applied to the frozen local acceptance database.
- Frontend Vitest retains the managed Windows path-normalization runner issue.
- `DEPLOYED_DATA_EVIDENCE_REQUIRED` remains open.

No merge, deployment, provider call, or Stitch invocation occurred. G1E was not generated or executed.

## Immutable checkpoints

```text
Frontend G1D checkpoint: 2a73e18c27d3850dcb398df8fbea9cbc34ae6a17
Backend G1D checkpoint: 18acfee37d1d3797a60d25bec2896b2ffc10d055
```
