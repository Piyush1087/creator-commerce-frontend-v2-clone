# Frontend security notes (§15)

See also the program scan in this folder’s `security-release-check.md`.

| Topic | Frontend evidence |
| --- | --- |
| Auth gate | `src/shared/auth/require-auth.tsx` redirects anonymous shell routes to `/login` |
| Creator platform gate | `creator-platform-route-guard.tsx` |
| C-01 no client redirectUri | `creator-entry-architecture.test.ts` |
| Marketplace hidden | `app-routes.tsx` `CampaignUnavailable` / `LegacyCampaignRedirect` |
| Vite secrets | only `VITE_*` public names; no server secrets in FE |

Frontend hide does not disable backend OUT APIs.
