# G0.0 — Campaign Page baseline freeze

## Result

**ACCEPTED.** This artifact freezes the source baseline only; it makes no runtime-source change.

## Canonical authority

- Repository: `Piyush1087/dummy_tcs`
- Ref: detached canonical Phase G specification baseline
- SHA: `3bc6457f99b24e1ef5767e5c80136f9b4c55f861`
- Verification: clean `git status --short --branch`; `git fsck --no-dangling` returned successfully.
- The commit message is `docs(campaign): add Phase G master Codex prompt` and contains this run's governance pack.

## Deployable implementation baselines

| Layer | Repository/ref | SHA | Why it is the deployable baseline |
|---|---|---|---|
| Frontend | `Piyush1087/creator-commerce-frontend-v2-clone`, `main` | `7e5750240c554aca6e651c31de371a8bd25ec3dc` | `sst.config.ts` maps push events for `main` to the `dev` deployment stage and defines the dashboard static-site deployment. |
| Backend | `Piyush1087/creator-commerce-backend-v2-clone`, `main` | `5bce1f948e23774f16c7f2c65a309cc4e0a7fe71` | paired Creator Shop API repository with SST ECS/API deployment configuration; frontend defaults `VITE_API_URL` to its API domain. |

Both implementation trees were clean at freeze. The frontend working branch `phase-g/campaign-page-g0-audit` was then created from the frozen frontend `main` SHA. No runtime source was changed.

Historical feature-only worktrees named `feature/create-campaign-g2-ux` and `feature/create-campaign-g2-readiness` were inspected but are explicitly **non-authoritative** for this Campaign Page baseline: the deployment config automatically deploys only `main`.

## Route, composition, and API topology

- Brand campaign list: `AUTH_ROUTES.brandUceCampaigns`
- Brand campaign create: `AUTH_ROUTES.brandUceCampaignCreate`
- Brand campaign detail: `AUTH_ROUTES.brandUceCampaignDetail`
- Protected shell: `AppShellLayout` wraps the brand routes.
- Current Campaign Page composition entry: `src/pages/brand/uce/BrandUceCampaignDetailPage.tsx`.
- Current frontend Campaign client: `src/features/uce/api/brand-uce-client.ts`.
- API base controller: `/api/v1/brand-uce` in `src/features/brand-uce/brand-uce.controller.ts`.
- Current Campaign read endpoint: `GET /campaigns/:campaignId`; companion endpoints include Campaign status/essentials, products, briefs, pipeline workspaces, and reporting.

## Runtime and persistence baseline

- Frontend tooling: Vite, React, TypeScript, Vitest; package scripts provide `typecheck`, `lint`, `test`, and `build`.
- Backend tooling: NestJS, Prisma, TypeScript, Vitest; Campaign runtime is under `src/features/brand-uce`.
- Prisma Campaign-era migrations include `20260601120000_uce_universal_campaign_engine`, `20260725140000_uce_add_asset_brief_wizard`, and `20260727120000_uce_campaign_status_archived`.
- No runtime check was run in G0.0; G0 is source-audit work and no database/provider is required yet.

## Dependencies and boundaries

- The production frontend and backend use SST configurations for Creator Shop dashboard/API deployment.
- Backend module dependencies include Prisma, authentication, Brand Centre, and Collaboration.
- Provider/Intelligence availability is a later audit boundary; no provider success is implied by this freeze.
- Create Campaign is an integration dependency only. Its historical feature branches are not reopened unless Campaign Page evidence shows a regression.

## Authority hierarchy used

1. frozen canonical `dummy_tcs` Phase G and Campaign contracts;
2. frozen frontend consumer contracts;
3. deployable `main` frontend/backend implementation;
4. historical feature worktrees and UI references as evidence only.

## G0.0 Supervisor normalization

```text
Stage: G0.0
Status: ACCEPTED
Starting frontend SHA: 7e5750240c554aca6e651c31de371a8bd25ec3dc
Final frontend SHA: 7e5750240c554aca6e651c31de371a8bd25ec3dc
Starting backend SHA: 5bce1f948e23774f16c7f2c65a309cc4e0a7fe71
Final backend SHA: 5bce1f948e23774f16c7f2c65a309cc4e0a7fe71
Findings addressed: deployable-source authority
Findings remaining: none at this stage
Tests/checks run: Git identity/status/ref checks, canonical fsck, SST deployment configuration inspection, route/API topology inspection
Checks not run: local runtime smoke, database migration execution, provider checks
Environment blockers: none for G0.0
Debt introduced/retained: none
Unexpected backend/frontend requirement: none
Migration blocker: none
Next-stage recommendation: ADVANCE_AUTONOMOUSLY to G0.1
```
