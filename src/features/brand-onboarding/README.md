# Brand onboarding (v2 frontend)

Source material: `aurora-brand-dna` AI Studio prototype. This module implements
the journey using **Aurora** primitives and feature-scoped CSS
(`brand-onboarding.css`).

## Routes

- `/` — marketing landing + URL capture + modals
- `/brand/onboarding/scan` — scan experience (mock timers until wired)
- `/brand/onboarding/dna` — Brand DNA review (mock until wired)
- `/brand/onboarding/catalogue` — catalogue (mock until wired)
- `/brand/onboarding/competitors` — competitors (mock until wired)

## Backend integration (Step 1)

- **Contracts:** `contracts/discovery.contracts.ts` (validate + resolve outcomes;
  keep in sync with `creator-commerce-backend-v2/docs/api/brand-discovery.openapi.yaml`).
- **HTTP client:** `api/discovery-client.ts` uses `VITE_API_URL` (see
  `src/shared/config/env.ts`).
- **Landing flow:** calls `POST /api/v1/discovery/resolve` then `POST
  /api/v1/discovery/validate` when needed; shows `OrgClaimedModal` when
  `outcome === "org_claimed"`.

Later steps should move off `mock-data/` into `shared/api` as endpoints ship.

## Cross-repo requirements (authoritative)

Product-facing frontend rules (catalogue templates, removing mocks **and** fallback static data, env variable **names** only in docs) live in the backend docs repo:

`creator-commerce-backend-v2/docs/brand-onboarding/FRONTEND_REQUIREMENTS.md`
