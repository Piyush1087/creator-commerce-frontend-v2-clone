# Brand discovery (contract only)

This folder holds **types and documentation** for the Step 1 discovery API. No
UI ships here yet; product prototypes will land in `src/temp` first per
`AGENTS.md`, then graduate into real pages.

## API contract (shared truth)

TypeScript mirrors the backend OpenAPI document:

- `schemas/discovery-validate.contract.ts`

Backend source of truth:

- `creator-commerce-backend-v2/docs/api/brand-discovery.openapi.yaml`

## Planned layout (no routes wired yet)

When the Aurora page exists, it should live under:

- Page entry: `src/pages/brand/onboarding/`
- Feature UI/services: `src/features/brand-discovery/`

See `LAYOUT_DIRECTIVES.md` for the page vs feature split.
