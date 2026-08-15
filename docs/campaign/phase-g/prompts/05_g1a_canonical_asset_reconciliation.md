# G1A — Canonical Campaign Asset and reconciliation foundation

## Task

Implement only CAM-G0-001 and the active-legacy reconciliation-required boundary that it enables.

## Baselines

- Canonical: `3bc6457f99b24e1ef5767e5c80136f9b4c55f861`
- Frontend: `7e5750240c554aca6e651c31de371a8bd25ec3dc`, branch `phase-g/campaign-page-g0-audit`
- Backend: `5bce1f948e23774f16c7f2c65a309cc4e0a7fe71`, branch `phase-g/background-runtime-safety`

## Frozen decisions

- New Campaign Page writes use canonical Campaign Asset authority.
- An active legacy-only Campaign requires explicit Brand Centre entity selection before operational execution.
- Do not infer Brand Centre identity; do not backfill uncertain records; do not delete legacy data/endpoints.
- Historical legacy compatibility is bounded/read-only and never authority for new execution.

## Required implementation

Create the minimum explicit canonical Asset read/write boundary, using an additive/reversible migration only if required. The Brand must explicitly select the correct BrandProfile, Offering, or BrandOffer; do not infer a selection even if one candidate exists. Add a Campaign Page projection for the Brand-facing reconciliation-required state with the approved copy: “Campaign setup needs reconciliation” and “Link the correct Brand Centre Asset before continuing this Campaign.” Ensure no new path writes legacy UCE Products.

## Non-goals

Do not migrate legacy Briefs, Applications, or Collaboration lineage. Do not remove legacy tables/endpoints, alter provider integrations, or reopen Create Campaign.

## Verification

Add focused deterministic tests for explicit selection, blocked execution without Asset, no inferred identity, and read-only historical compatibility. Run scoped typecheck/build/lint, Prisma validate/generate, and relevant backend regressions. Produce `05_g1a_canonical_asset_reconciliation.md` with the Phase G acceptance result.
