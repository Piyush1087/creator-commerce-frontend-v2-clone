# Frontend Layout Directives

This document defines where files go, how pages relate to features, and how
future routing should be wired.

## Page vs Feature Responsibility

| Layer | Role |
| --- | --- |
| `src/pages/...` | Entry and composition only: assemble feature components, layout shells, tabs, and light page orchestration. |
| `src/features/...` | Domain home: section UI, hooks, feature services, schemas, types, and mock data. |
| `src/design-system/aurora` | Shared visual primitives and tokens only. No feature logic. |
| `src/layouts/app-shell` | Authenticated dashboard frame: sidebar, header, drawer, bottom nav, and main content slot. |
| `src/layouts/brand-onboarding-shell` | Public brand onboarding chrome (marketing header, step links, mobile drawer). Not the authenticated app shell. |
| `src/temp/...` | Mock-only visual review pages. No real API calls. |

## Future Page Structure

When real product pages are added, use role folders:

- `src/pages/brand/**`
- `src/pages/influencer/**`
- `src/pages/admin/**`
- `src/pages/auth/**`
- `src/pages/public/**`

Prefer kebab-case files with a `-page` suffix:

```text
src/pages/brand/campaigns/brand-campaigns-page.tsx
```

Pages should compose feature modules:

```text
src/features/campaigns/components
src/features/campaigns/services
src/features/campaigns/types.ts
src/features/campaigns/mock-data
```

## Feature Module Shape

Use this as the default feature layout:

```text
src/features/<feature-name>/
  components/
  services/
  schemas/
  types.ts
  mock-data/
```

Rules:

- Feature-specific UI stays inside the feature.
- Feature API helpers stay inside the feature unless multiple features use them.
- Shared DTOs can move to `src/shared` only when there is a proven cross-feature
  need.
- Avoid monolithic `types.ts` files outside prototypes.

## Shared Code

Use shared folders only for genuinely cross-cutting code:

- `src/shared/api`
- `src/shared/config`
- `src/shared/components`

If a component only makes sense for one feature or role, keep it inside that
feature.

## App Shell

The app shell lives in `src/layouts/app-shell`.

It owns:

- desktop sidebar placement
- mobile hamburger drawer
- sticky header
- mobile bottom navigation
- main content slot
- responsive shell behavior

It does not own feature navigation logic, business state, data fetching, or
feature-specific UI.

## Routing Rules

The current v2 shell is intentionally minimal. When routing is introduced:

1. Add page entrypoints under the correct `src/pages/<role>` folder.
2. Add route config under `src/routes`.
3. Keep `App.tsx` as app composition only.
4. Do not use `if` chains or local state in `App.tsx` to switch screens.
5. Ensure new screens are actually reachable.

Suggested route folders:

```text
src/routes/app-routes.tsx
src/routes/brand-routes.tsx
src/routes/influencer-routes.tsx
src/routes/admin-routes.tsx
```

## Prototype Intake Rule

Standalone AI Studio or Stitch prototypes must not be pasted directly into
`src/pages`.

First land them under `src/temp/<prototype-name>` with:

- a `types.ts` file for planned API/domain data
- mock data only
- notes in `docs/ai-collaboration`

Then split into real `pages`, `features`, `services`, and `schemas` when the
module is approved.
