# Frontend proof files for the §11 suite

These are the freeze-branch files that prove the FE side of each invariant. Execution is still in `../18-validation/`.

| ID | Frontend proof |
| --- | --- |
| INV-01 | `src/shared/auth/*`, `src/features/auth/*`, `src/shared/auth/require-auth.tsx` |
| INV-03 | `src/features/creator-onboarding/components/creator-platform-route-guard.tsx` |
| INV-04 | `src/features/settings/components/creator-settings-action-guard.tsx`, `src/layouts/app-shell/creator-shell-capabilities.ts` |
| INV-05 | `src/layouts/app-shell/sidebar-items.ts`, `src/layouts/app-shell/bottom-nav-items.ts`, `src/routes/app-routes.tsx` |
| INV-07 | `src/features/collaboration/components/CollaborationRouteGuard.tsx`, `src/pages/brand/collaborations/*`, `src/pages/creator/collaborations/creator-collaborations-page.tsx` |
| INV-11 | API clients under `src/features/*/api/` — display-only; mutations go to backend |

C-02A Home is not a proof target. `/creator/home` is `src/pages/creator/home/creator-workspace-entry-page.tsx` (C-05 entry).
