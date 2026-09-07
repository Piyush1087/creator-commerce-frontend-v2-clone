# Brand Payouts Wave C frontend preflight handoff

Status: `GENUINE_CLASS_C_BLOCKED`

This handoff records the bounded preflight for `BRAND_PAYOUTS_WAVE_C_COHERENT_FRONTEND_EXECUTION_RUNNER_V1`. No frontend source was changed because the accepted Wave B contract cannot authorize the first-reserve command from any frontend state.

## Immutable binding

- Wave C branch: `brand-payouts/wave-c-frontend-v1`
- Accepted frontend base: `7c75a4c8f5a0df3a1fb82d2f707b1c6b03d56d2a`
- Accepted frontend base tree: `956bae22a91aeaf53733f9e913d500b9750577e2`
- Bound backend: `46c71fd554d7621d9bd13d1bbc3115646a7c56bd`
- Bound backend tree: `40c1f931be6c2e358394ed5944f67d714b98f09d`
- Migration: `20260912100000_brand_payouts_wave_b_normal_path`
- Migration SQL SHA-256: `887e5bb6bd262a4dd02e42a798db55bd136d97bf6a923df7e6466573f11d1f84`
- Migration count: 86

The frontend and backend worktrees were clean at preflight. The frontend branch was created directly from the accepted base. The backend head/tree and migration hash match the frozen Wave C inputs.

## Stable blocker signature

`WAVE_C_CLASS_C_RESERVE_APPROVAL_AUTHORITY_UNREACHABLE`

The accepted backend command `POST /api/v1/brand/payouts/reserve-approvals` requires a UUID `reserve_instruction_id` and an idempotency key. The ID is intentionally server-owned financial authority. However, the only public reserve-request read endpoint (`GET /api/v1/brand/payouts/reserve-requests`) is hard-coded to return:

- `coverage: UNAVAILABLE`;
- `available_actions: []`;
- `payload: []`;
- `source_complete: false`.

The accepted `BrandPayoutsReadAction` union also has no reserve-approval action. Consequently no authenticated Owner or Finance frontend state can obtain a current reserve instruction ID, its version, or a server-authorized approval action. Calling the mutation would require inventing or importing a private identifier and would violate the runner's prohibition on caller-authored financial authority and weakened capability/RBAC checks.

This is not a CSS, focus, pagination, fixture, or local-preview defect. A test-only fabricated row would prove a UI against a contract production never emits and would not make the required built-stack state reachable.

## Exact reproduction

1. At backend SHA `46c71fd554d7621d9bd13d1bbc3115646a7c56bd`, inspect `src/features/brand-payouts/dto/brand-payouts-command.dto.ts`: approval requires `reserve_instruction_id` as a UUID.
2. Inspect `src/features/brand-payouts/services/brand-payouts-query.service.ts`, method `listReserveRequests`: it unconditionally emits unavailable coverage, no actions, and an empty payload.
3. Inspect `src/features/brand-payouts/contracts/brand-payouts-v2.contract.ts`: `BrandPayoutsReadAction` has no reserve approval action.
4. There is no other public Brand Payouts response that exposes `reserve_instruction_id`.

## Completed gates

- Exact frontend base/head/tree and remote ref verified.
- Exact backend head/tree and clean worktree verified.
- Migration identity, count, and SQL SHA-256 verified.
- Existing P3A frontend contract reviewed for identity, list/detail navigation, pagination, stale restoration, responsive 767/768 cutover, command-surface exclusivity, focus, deduplication, and fail-closed role handling.
- Wave B C05 binding reviewed: provider-neutral execution fences current destination ID/version before claim.
- Wave B production provider boundary reviewed: capability absence fails closed before transfer creation.
- No source, migration, provider, production, AWS, or database mutation occurred.

## Required upstream correction

The backend authority must add a safe, versioned read contract that exposes the current server-owned reserve instruction through a Brand-scoped row and explicit server-authorized approval action (or define another Product-authorized command initiation contract). It must specify the public/display reference separately from the API resource ID and the response contract for approval. Any such financial API change requires upstream approval and a new bound backend SHA; it cannot be invented in Wave C frontend scope.

## Deferred scope

All Wave C source implementation and browser-matrix work remains deferred until the contradiction is corrected. Wave D, provider-enabled P6, P3S, generalized recovery, production/AWS action, canonical merge, and deployment remain excluded.
