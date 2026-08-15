# G1E — State, compatibility, and validation closure

## Baselines

- Frontend G1D: `2a73e18c27d3850dcb398df8fbea9cbc34ae6a17`
- Backend G1D: `18acfee37d1d3797a60d25bec2896b2ffc10d055`

## Task

Close Phase G functional validation without adding a new domain authority. Complete Campaign Page state coverage, compatibility proof, responsive verification, and validation debt closure. Preserve Reporting as a truthful unavailable consumer unless an existing canonical provider contract is available.

## Required closure

- Prove loading, empty, not-ready, reconciliation, terminal/read-only, unavailable/degraded, error/retry, no Applications/Collaborations, Reporting unavailable, and mobile behavior.
- Prove legacy Product/Brief/pipeline mutations cannot be operationally reached; canonical records win; legacy Reporting is not consumed.
- Use a disposable database derived from the approved local baseline only if safely determinable; never mutate `creator_shop_acceptance`.
- Resolve/run frontend Vitest through a non-source-changing short-workspace strategy where possible.
- Add dedicated G1D coverage and run all accepted G1 regressions.

## Gate

G1E may retain only debt that does not invalidate consolidated functional acceptance. Generate, but do not execute, the consolidated G1 acceptance package after Supervisor review. No G2, Stitch, merge, or deploy.
