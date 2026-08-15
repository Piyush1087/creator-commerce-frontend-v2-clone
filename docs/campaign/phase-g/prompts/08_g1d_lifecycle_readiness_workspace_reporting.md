# G1D — Lifecycle, readiness, workspace, and Reporting projection

## Baselines

- Canonical: `3bc6457f99b24e1ef5767e5c80136f9b4c55f861`
- Frontend G1C checkpoint: `49b2d34ca7f48b0701ed0adf235661862344e4fd`
- Backend G1C checkpoint: `471d78bbd651ffadb1afbf13cf921f11214feef0`

## Task

Implement the minimum backend-authoritative Campaign lifecycle, readiness, workspace, and Reporting consumer projection. Preserve G1A Asset reconciliation, G1B canonical Briefs/Deliverables, and G1C Application/Collaboration boundaries.

## Frozen authority

- Backend alone authorizes lifecycle actions and readiness.
- Lifecycle and readiness are separate; readiness loss never automatically demotes a live Campaign.
- Workspace visibility, priority, availability, counts, and disabled states come from backend projection.
- Reporting is consumed only. When unavailable, return truthful unavailable/degraded state without legacy snapshot reuse or fabricated metrics.
- Do not change Create Campaign, Collaboration semantics, or use legacy Product/Brief/pipeline counts for authority.

## Verification

Add focused backend/frontend tests for capabilities, separate lifecycle/readiness, reconciliation blocking, canonical Asset/Brief requirements, workspace projection, no legacy pipeline authority, Reporting truthfulness, and post-live readiness loss. Run prior G1 regressions, typechecks/builds, scoped lint, Prisma validate/generate only, and document exact debt. Do not apply migrations, run G1E, merge, deploy, or invoke Stitch.
