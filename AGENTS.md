# Frontend Agent Directives

These rules apply to every AI agent, prototype import, and manual frontend
change in this repo.

## Mission

Keep the v2 frontend clean, modular, typed, and easy to port into production.
Outside output from AI Studio, Stitch, or other agents is source material, not
repo-ready code.

## Non-Negotiables

- Prefer Aurora primitives (`src/design-system/aurora`) for buttons, inputs,
  cards, badges, tabs, alerts, and progress. Tailwind, utility-first CSS,
  Shadcn, Bootstrap, or other UI stacks are allowed only when scoped to an
  approved feature intake and documented in `docs/ai-collaboration` (easier
  ports from prototypes). Default new work should still stay Aurora-first.
- No large page files. A page composes feature components; it does not become
  the feature.
- No route switching inside `App.tsx`.
- No `any`. If a boundary is unknown, model it with a type, schema, or explicit
  `unknown` narrowing.
- No per-screen reinvention of buttons, inputs, cards, badges, tabs, modals, or
  navigation. Use `src/design-system/aurora`.
- No backend data calls from temporary playgrounds.
- No secrets in code, docs, examples, screenshots, or prompts.

## Required Structure

- `src/app` owns app composition only.
- `src/layouts/app-shell` owns dashboard shell, header, sidebar, mobile drawer,
  and bottom navigation.
- `src/pages/<role>/<area>/<name>-page.tsx` will own route entry pages once real
  routes are added.
- `src/features/<feature-name>` owns feature UI, services, types, and mock data.
- `src/shared/api` owns global API clients and cross-feature API helpers.
- `src/shared/config` owns environment helpers.
- `src/design-system/aurora` owns tokens and reusable UI primitives.
- `src/temp` owns temporary mock-only review screens.

## Before Starting Work

1. Read `LAYOUT_DIRECTIVES.md`.
2. Read `DESIGN_SYSTEM.md`.
3. Read the relevant docs under `docs/ai-collaboration`.
4. Decide whether the work is a temporary playground, a real page, or a feature
   module.
5. Write or update types before wiring UI to APIs.

## Definition Of Done

- The screen is reachable through the intended app composition or route path.
- TypeScript, build, and lint pass.
- New UI uses Aurora tokens/primitives.
- Mobile behavior is considered, especially sidebar-to-drawer/bottom-nav and
  table-to-card transformations.
- Any imported AI artifact has an intake note or checklist result in
  `docs/ai-collaboration` when it affects architecture.
