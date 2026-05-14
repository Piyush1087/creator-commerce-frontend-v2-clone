# Frontend Runbook And Tracker

This is the main entrypoint for continuing frontend work. Start here before
opening source files or asking an AI agent to generate code.

## Current Status

- Repo purpose: clean v2 frontend shell for TheCreatorShop.
- Current default entry: **brand onboarding** at `/` (React Router in
  `src/routes/brand-onboarding-app.tsx`).
- Onboarding chrome: `src/layouts/brand-onboarding-shell` (not the authenticated
  `app-shell`).
- Feature module: `src/features/brand-onboarding` (mock data + Zod + Aurora UI).
- Backend discovery contract types live in
  `src/features/brand-discovery/schemas/discovery-validate.contract.ts` (API
  wiring still pending).
- Current design system: Aurora in `src/design-system/aurora`.
- `src/temp/aurora-playground` remains for design-system experiments but is not
  the default route anymore.
- Backend connection: API client is wired through `src/shared/api` and
  `VITE_API_URL`; onboarding flow is **mock-only** for now.
- Deployment identity: kept as `creatorshop-fe`.
- Git status: not initialized/committed by the agent yet.
- Branch policy: long-lived branches are `main` and `development`.

## Completed Setup

- Clean Vite/React/TypeScript app.
- SST static site config with old app name/profile/domain conventions.
- Aurora tokens and design primitives.
- Dashboard shell with sidebar, header, mobile drawer, and bottom nav.
- Temporary Aurora visual playground.
- Brand onboarding port from `aurora-brand-dna` (mock flow + Router).
- API client base wiring.
- Root docs and AI collaboration guardrails.

## Temporary Items To Remove Or Replace Later

Track temporary work here so it does not get forgotten.

| Item | Location | Why It Exists | Remove/Replace When |
| --- | --- | --- | --- |
| Aurora playground | `src/temp/aurora-playground` | Design-system review | Fold or delete when no longer needed |
| Placeholder nav labels | `src/layouts/app-shell/navigation.ts` | Shell review without real routes | Route map is finalized |
| Onboarding mock timers | `src/features/brand-onboarding/components/brand-scan-view.tsx` | Prototype pacing | Replace with real job/progress API |

## Next Work Queue

Use this list as the default pickup queue.

1. Wire `POST /api/v1/discovery/validate` into `LandingUrlCapture` using
   `src/features/brand-discovery/schemas/discovery-validate.contract.ts`.
2. Introduce a global entry layout (auth vs marketing) and move onboarding off
   `/` when product locks IA.
3. Expand Aurora primitives only when a real feature needs them.
4. Decide fate of `src/temp/aurora-playground` (keep behind `/temp/design` or
   remove).

## Start-Of-Session Checklist

When resuming work:

1. Read this file.
2. Read `AGENTS.md`.
3. Read `LAYOUT_DIRECTIVES.md`.
4. Read `DESIGN_SYSTEM.md`.
5. Read `BRANCHING.md` before creating or switching branches.
6. Check `Temporary Items To Remove Or Replace Later`.
7. Pick exactly one item from `Next Work Queue` or add a new tracked item here.
8. If using outside AI output, review it with
   `docs/ai-collaboration/external-artifact-intake.md`.

## How To Ask For Work

Use this format with teammates or AI agents:

```md
Repo: creator-commerce-frontend-v2
Start from: RUNBOOK.md
Task:
Work type: temp playground | production page | feature module | design-system primitive
Target files/folders:
Docs to read:
- AGENTS.md
- LAYOUT_DIRECTIVES.md
- DESIGN_SYSTEM.md
Acceptance checks:
- npm run build
- npm run lint
```

## Docs Map

- `README.md` quick repo overview.
- `BRANCHING.md` long-lived branch and promotion policy.
- `AGENTS.md` non-negotiable agent rules.
- `LAYOUT_DIRECTIVES.md` page, feature, shell, and routing placement.
- `DESIGN_SYSTEM.md` Aurora design-system rules.
- `docs/design-system/README.md` Aurora source references and token rules.
- `docs/temporary-playgrounds/README.md` temporary visual page policy.
- `docs/ai-collaboration/README.md` process for outside AI/team artifacts.
- `docs/ai-collaboration/frontend-review-checklist.md` review checklist.
- `docs/ai-collaboration/2026-05-14-aurora-brand-dna-port-intake.md` prototype
  port notes.
- `docs/ai-collaboration/team-request-template.md` request template.
- `docs/deployment/README.md` SST/domain deployment notes.
- `docs/local-development/README.md` local run commands.

## Verification Commands

```bash
npm run build
npm run lint
```

## Decision Log

| Date | Decision |
| --- | --- |
| 2026-05-13 | Start frontend v2 clean instead of cleaning old deprecated app code. |
| 2026-05-13 | Keep old SST app name/profile/domain conventions for future takeover. |
| 2026-05-13 | Use Aurora as the only frontend design system. |
| 2026-05-13 | Keep AI/Stitch prototypes under `src/temp` until approved and split. |
| 2026-05-14 | Port `aurora-brand-dna` onboarding flow: Router, onboarding shell, pages under `src/pages/brand/onboarding`, feature module with mock data + Zod; `/` is temporary marketing entry. |
