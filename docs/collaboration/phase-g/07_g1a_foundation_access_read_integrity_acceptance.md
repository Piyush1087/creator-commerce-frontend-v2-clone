# Collaboration Phase G — G1A Foundation, Access & Read Integrity

**Status:** ACCEPTED WITH DEBT  
**Captured:** 2026-08-14  
**Package:** G1A only — no G1B/G1C, no Stitch, no merge, no deploy  
**Backend:** read-only at accepted G1R SHA

---

## SHAs

| Field | Value |
|---|---|
| Starting frontend SHA | `44b201cea549376c240c4bef7a663dc2c04ebde2` |
| Starting backend SHA | `efffc2701a61bbd49748a28608d54f927ee44a4e` |
| Final frontend SHA | `eafa4c071ae0da49739b7f531f59e536978dae42` |
| Final backend SHA | `efffc2701a61bbd49748a28608d54f927ee44a4e` (unchanged) |

**Phase-G frontend baseline updated:** YES

---

## Findings closed

| ID | Result |
|---|---|
| COL-G0-001 | Role-aware Collaboration route guard; opposite-role redirect; Admin/unknown never Brand |
| COL-G0-002 | Detail resolved by requested id; never `rows[0]`; frozen unavailable copy |
| COL-G0-003 | Inbox shows counterpart, handle, Campaign, Asset, Brief from existing projection |
| COL-G0-004 | Zod list/detail/messages parse; missing `publishingRequired` fails canonical detail |
| COL-G0-013 | Compatibility discriminant + Limited-details copy; execution hub hidden |
| COL-G0-015 | Production missing/localhost API URL fail-fast; DEV proxy/localhost sockets preserved |
| COL-G0-018 | Creator bottom nav Home · Campaigns · Collaborations · Profile; Insights kept on sidebar; owned deep-link opens Chat step |
| COL-G0-020 | Vitest 2 + node tests for helpers/schemas/env/nav |

---

## Files changed

- `src/routes/app-routes.tsx`
- `src/features/auth/constants.ts`
- `src/features/collaboration/components/CollaborationRouteGuard.tsx`
- `src/features/collaboration/components/CollaborationWorkspace.tsx`
- `src/features/collaboration/api/collaboration-client.ts`
- `src/features/collaboration/schemas/collaboration-read.schemas.ts`
- `src/features/collaboration/utils/collaboration-route-access.ts`
- `src/features/collaboration/utils/collaboration-selection.ts`
- `src/features/collaboration/utils/collaboration-inbox-identity.ts`
- `src/features/collaboration/utils/collaboration-mobile-step.ts`
- `src/shared/config/env.ts`
- `src/shared/config/resolve-env.ts`
- `src/layouts/app-shell/bottom-nav-items.ts`
- `package.json` / `package-lock.json`
- `vitest.config.ts`
- matching `*.test.ts` files under collaboration, shared/config, app-shell

---

## Dependencies added

- `vitest@2.1.9` (dev). Vite 4.x of vitest was avoided because latest vitest 4 pulled Vite 8 / Node `^20.19`.

## Test architecture

Vitest 2, Node environment, `src/**/*.test.ts`. No Testing Library. No Playwright.

## Tests added / passed / failed

- Added: 18
- Passed: 18
- Failed: 0

## Typecheck

PASS — `npm run typecheck` (`tsc -b`)

## Lint

PASS — scoped eslint on G1A changed paths. Full-repo lint not run.

## Production build

PASS — developer-run `npm run build` (`tsc -b && vite build`, 2379 modules, ~35s). Chunk-size warning only; not a failure.

## Runtime smoke

RUNTIME_ACCEPTANCE_PENDING_ENVIRONMENT — local Brand/Creator runtime smoke not run in this session.

## Environment blockers

None for source/test/build acceptance. Runtime smoke still pending full local Brand/Creator env.

## Compatibility debt retained

- LEGACY_COMPATIBILITY rows still have chat history; per-Deliverable hub is replaced by Limited-details copy.
- Legacy `?collaboration=` still accepted; new picks write `?thread=`.
- Compatibility Zod branch is explicit (`projectionSource` discriminant); malformed canonical is not coerced into compatibility.

## G1R debt retained

1. Prettier/ESLint formatting on the three COL-G0-005 Brand-UCE files — not touched.
2. No dedicated Brand-UCE approve integration test — not added.

## Unexpected backend requirements

None.

## Merge / deployment status

Not merged. Not deployed. Committed and available on GitHub (`origin` + `piyush`).

## Final disposition

**ACCEPTED WITH DEBT**

Debt: runtime smoke pending local Brand/Creator environment only.
