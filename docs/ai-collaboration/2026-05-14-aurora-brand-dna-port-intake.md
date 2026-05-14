# Intake: `aurora-brand-dna` → `creator-commerce-frontend-v2`

**Date:** 2026-05-14  
**Source repo:** `D:\Work\cursor-repos\aurora-brand-dna` (AI Studio export).

## What was ported

- **Flows:** Landing URL capture → process preview modal → setup checklist modal
  → mock scan → DNA review → catalogue → competitors → return home.
- **Mock data:** Sample brand DNA, catalogue products/offers, competitors, scan
  steps, journey steps (aligned with prototype constants).
- **Validation:** Zod `urlSchema` + `brandDnaFormSchema` (client-side only).

## What was intentionally changed vs the prototype

- **Stack:** Removed MUI/Emotion/Tailwind usage in favor of **Aurora** components
  and token-backed CSS in `src/features/brand-onboarding/brand-onboarding.css`.
- **Routing:** React Router lives in `src/routes/brand-onboarding-app.tsx`;
  `App.tsx` only composes `BrowserRouter` + routes (per `LAYOUT_DIRECTIVES.md`).
- **Layout:** Introduced `src/layouts/brand-onboarding-shell` for onboarding
  marketing chrome + mobile drawer; **not** the authenticated `app-shell`.
- **Paths:** Normalized to `/brand/onboarding/*` instead of `/brand-dna` style
  paths for clearer role grouping.

## Policy note

`AGENTS.md` / `DESIGN_SYSTEM.md` were updated to allow **documented** use of
utility-first stacks when porting prototypes; this intake covers the Aurora
implementation path.
