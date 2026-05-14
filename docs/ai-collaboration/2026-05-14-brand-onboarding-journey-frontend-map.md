# Frontend map: Brand onboarding journey (intake)

**Source:** Product markdown “Brand onboarding journey doc” (2026).  
**Engineering intake (backend):** See sibling backend repo file
`docs/ai-collaboration/2026-05-14-brand-onboarding-journey-intake.md`.

## What landed in frontend-v2 now

- Contract types for `POST /api/v1/discovery/validate` under
  `src/features/brand-discovery/schemas/discovery-validate.contract.ts`.
- Folder placeholders documenting future placement:
  - `src/features/brand-discovery/README.md`
  - `src/pages/brand/onboarding/README.md`

## Rules of engagement

- Marketing copy from the product doc is **not** implemented in code until UX
  locks content in Figma/Stitch and the page is promoted out of `src/temp`.
- Follow `LAYOUT_DIRECTIVES.md` (pages compose features; no monolithic pages).
- Follow `external-artifact-intake.md` when importing outside UI output.
