# Creator Commerce Frontend

Clean frontend shell for TheCreatorShop dashboard.

This repo intentionally starts small. It keeps the old deployment conventions
and removes product UI, auth, analytics, Prisma, and legacy API mappings.

## Start Here

Use `RUNBOOK.md` as the main tracker and session entrypoint. It records current
status, temporary items, next work, docs references, and decision history.

## Stack

- React 18
- Vite
- TypeScript
- SST `StaticSite`
- Axios API client

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app reads `VITE_API_URL` and defaults to `http://localhost:3000`.

## Scripts

- `npm run dev` starts Vite.
- `npm run build` type-checks and builds to `dist`.
- `npm run preview` serves the built app locally.
- `npm run lint` runs ESLint.

## Project Layout

- `src/app` app composition.
- `src/features/home` initial coming-soon screen.
- `src/layouts/app-shell` dashboard shell, sidebar, header, drawer, and bottom nav.
- `src/shared/api` API client wiring.
- `src/shared/components` shared UI components.
- `src/shared/config` environment helpers.
- `src/design-system/aurora` Aurora tokens and reusable UI primitives.
- `src/temp/aurora-playground` mock visual playground for design review.
- `docs` operational and setup notes.

## Design System

The current app opens the Aurora playground by default so the visual system can
be reviewed before real product modules are added. See `docs/design-system` and
`docs/temporary-playgrounds` for details.

## Agent Instructions

Before adding generated or teammate code, read:

- `AGENTS.md`
- `BRANCHING.md`
- `LAYOUT_DIRECTIVES.md`
- `DESIGN_SYSTEM.md`
- `docs/ai-collaboration/README.md`

## Deployment Notes

The SST app name, AWS profiles, region, domains, and certificates intentionally
match the old frontend repo. Do not deploy from both old and v2 repos to the
same stage at the same time.
