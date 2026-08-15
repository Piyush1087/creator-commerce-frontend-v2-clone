# G1C — Discovery, Applicants, and Collaboration cutover

## Task

Implement the minimum Campaign Page consumer/reference boundary for Discovery, canonical Applications, and independent Collaborations, starting from accepted G1A and G1B checkpoints.

## Baselines

- Canonical specification: `3bc6457f99b24e1ef5767e5c80136f9b4c55f861`
- Frontend G1B checkpoint: `59fe932f71441ec4449ba83ea614a698561f1795`
- Backend G1B checkpoint: `a3fa13d40c5cc5b9b4e5f09c59f38a1020790ff9`

## Frozen authority

- Discovery is pre-application acquisition/recommendation authority.
- Application is the decision aggregate for creator applications.
- Independent Collaboration owns post-acceptance lifecycle; Campaign Page consumes only its reference/projection.
- Legacy UCE pipeline is never new operational Campaign authority. Terminal legacy rows may remain bounded read-only compatibility.

## Required implementation

1. Add only additive, reversible persistence/contract changes necessary for canonical Application identity, Campaign/Brief references, explicit decision state, and an optional independent Collaboration reference.
2. Do not infer a canonical Application or Collaboration from a `UceCampaignCollaboration` row. Existing independent Collaborations win when explicitly linked.
3. Expose Brand-scoped Campaign Page read projections for Discovery, Applicants, and Collaboration references. If Discovery has no authoritative provider/data, report an unavailable/empty state truthfully; never repurpose legacy prospects.
4. Expose Application decision commands only on canonical Applications. Acceptance may record acceptance but must not fabricate or create a Collaboration where required commercial/brief/creator information is missing.
5. Replace the Campaign Page operational pipeline workspace with the canonical consumer projection. Legacy pipeline data, where shown, is terminal/read-only only and has no lifecycle controls.
6. Preserve G1A Asset and G1B Brief safeguards. Do not change Create Campaign, Reporting, lifecycle/readiness work assigned to G1D, or Collaboration domain semantics.

## Non-goals

- No mass backfill, destructive retirement, migration application, or invented lineage.
- No Collaboration lifecycle command implementation.
- No provider calls, Stitch, merge, deploy, or G1D work.

## Verification

Add deterministic tests for application ownership/decision authority, no implicit Collaboration creation, no legacy pipeline write path, terminal compatibility, and truthful Discovery unavailability. Run Prisma validate/generate with the approved ephemeral local URL only, focused tests, prior regressions, typechecks, builds, scoped lint, and diff review. Produce G1C evidence and update run state. Do not execute G1D in this package.
