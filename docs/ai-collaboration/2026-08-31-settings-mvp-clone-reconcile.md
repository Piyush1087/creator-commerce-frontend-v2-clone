# Settings MVP clone reconcile (frontend)

Date: 2026-08-31
Branch: `feature/settings-mvp-v2-integration` (from origin `development` @ PI merge PR #20)
Frozen source: clone `program/brand-settings-mvp` @ `3e2cabbe95c16ee23bd77fe20a44fe9b1d8670d2`

## Source of truth

- Executable Settings MVP UI: frozen clone SHA above
- Handoff: `docs/settings/product-docs/v2-handoff/Creator_Shop_Settings_MVP_Developer_Handoff.docx` (backend copy in backend-v2 repo)
- Base on origin `development` (Brand Centre v1 + Product Intelligence v1 already merged)

## Integration scope

- `src/features/settings/*` (brand + creator settings UI, clients, contracts)
- Auth session/recovery UI updates in `src/features/auth/*`
- Routes: `/brand/settings/general`, `/integrations`, `/billing`, `/escrow`; `/brand/settings` redirect
- Reconcile `app-routes.tsx` / shell without dropping PI or Brand Centre routes

## Preserve on origin

- Product Intelligence Offering pages and clients
- Brand Centre workspace routes and navigation
- Collaboration / campaign routes already on origin

## Pull method

Path checkout from frozen SHA for Settings-scoped paths; manual route/shell reconcile where origin differs from clone.
