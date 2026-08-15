# G1A — Canonical Campaign Asset reconciliation acceptance

## Supervisor decision

```text
G1A ACCEPTED WITH DEBT
```

The source implementation satisfies the approved G1A authority and acceptance gate. The retained debt is validation-environment debt, not a Product or ownership conflict, and does not make G1B source work unsafe.

## Accepted implementation

- An additive `UceCampaignAsset` model and migration support exactly one explicitly selected `BrandProfile`, `Offering`, or `BrandOffer` reference. The migration performs no backfill, deletion, or legacy-data mutation.
- Brand-scoped selection endpoints expose selectable Brand Centre entities and reject cross-brand, inactive, duplicate, or inferred selections.
- Campaign shell reads project canonical Assets and backend-authored capabilities/reconciliation state.
- Active executable legacy-only Campaigns are blocked from activation and display the approved Brand-facing reconciliation copy.
- The Campaign Page no longer exposes new legacy Product or Brief writes; existing legacy endpoints/data remain intact for bounded compatibility.
- Historical terminal Campaigns remain visible without fabricating canonical execution authority.

## Acceptance evidence

| Check | Result |
|---|---|
| Backend focused G1A tests | PASS — 5/5 |
| Backend TypeScript build typecheck | PASS |
| Backend production build | PASS |
| Frontend TypeScript typecheck | PASS |
| Frontend production build | PASS — 2,360 modules transformed; existing chunk-size warning only |
| Scoped frontend ESLint | PASS |
| Scoped new-backend-file ESLint | PASS |
| Prisma validate | PASS against the approved ephemeral local acceptance URL |
| Prisma generate | PASS |
| Database safety target | PASS — `127.0.0.1:5432/creator_shop_acceptance` |
| Migration applied / database mutated | NO |
| Diff whitespace check | PASS |

## Focused coverage

The passing backend suite verifies explicit BrandProfile, Offering, and BrandOffer selection; exact ownership enforcement; rejection of cross-brand selection; absence of legacy Product creation; active reconciliation blocking; and terminal read-only behavior. Frontend focused tests were authored for canonical display, the approved reconciliation copy, disabled submission before explicit selection, and submission of the exact chosen Offering.

## Retained debt

1. `G1A_RUNTIME_SCHEMA_ACCEPTANCE_REQUIRED`: the approved G1A migration was deliberately not applied to `creator_shop_acceptance`, so an end-to-end runtime exercise of the new schema/API/UI remains pending in a disposable or explicitly migration-authorized acceptance database.
2. `G1A_FRONTEND_TEST_RUNNER_ENVIRONMENT_DEBT`: the authored frontend Vitest suite cannot start in the managed Windows sandbox because Vite/esbuild resolves the workspace path through a denied ancestor. Frontend typecheck, production build, and scoped lint pass; this is not a failing assertion.
3. Repository-wide lint is not used as a G1A gate because both baselines contain unrelated pre-existing lint/format failures. Changed frontend files and new backend files pass scoped lint.

These debts must be cleared before consolidated G1 functional acceptance can be accepted. They do not authorize applying migrations to the frozen local database without a separate environment decision.

## Repository state

```text
Frontend branch: phase-g/campaign-page-g0-audit
Frontend accepted source checkpoint: b81f600d9a55a83ead8b423d379996b3864810fe
Backend branch: phase-g/g1a-canonical-asset
Backend accepted source checkpoint: 694b1c75c29298738c8b20ad03b35d05a4175138
Implementation state: immutable committed checkpoints; not merged; not deployed
```

## Gate conclusion

No new Product semantics, unresolved authority conflict, destructive migration choice, or unsafe ownership inference was introduced. Supervisor authorizes generation of G1B. Stitch and G2 remain ineligible.
