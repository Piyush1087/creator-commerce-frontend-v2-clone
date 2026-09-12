# 10 — Remaining §18 gates

**Date:** 2026-09-10  
**Run:** RUN 5 + RUN 7 INV-03 harness + RUN 8 viewport + RUN 9 local hygiene + RUN 11 Postmark live send + RUN 12 authAuthorizationHeader cutover

| Gate | Status | Classification |
| --- | --- | --- |
| fresh checkout / `npm ci` | PARTIAL | FE clone typecheck/lint/build PASS. BE clone validate PASS; clone nest hung under load. **Working-tree** `npx prisma generate` + `npm run build` Parent reconfirm PASS 2026-09-09 (`14-npm-ci-fresh-clone.md`) |
| module acceptance suites (this amendment) | PASS | Targeted C-04/C-02A/Payouts + INV-09 isolated. Canonical: backend-v2 `07-targeted-tests.md` / `10-remaining-gates.md` |
| cross-module invariant suite execution | PASS classified this amendment / PARTIAL leftover | postgres INV-01/02/03/04/12/06/07 PASS (INV-03 **29/29** RUN 7). INV-09/11/13 PASS classified. **INV-08 PARTIAL until C-06 pull.** **INV-10 PARTIAL** live IG/Razorpay `PROVIDER_DEFERRED` |
| frontend ↔ backend smoke | PASS | Canonical: backend-v2 `12-frontend-backend-smoke.md` (C-02A Home, Parent 2026-09-11) |
| auth/session regression | PASS postgres INV-01 | plus RUN 4 static/unit |
| RBAC / actor-subject / cross-tenant | PASS postgres INV-04 + INV-12 | |
| responsive shell/navigation smoke | PASS | RUN 8 Parent confirm: UCE table→cards + Creator viewport (`16-viewport-smoke.md`) |
| provider-unavailable recovery | PASS classified / deferred live | Postmark OTP live send **PASS** 2026-09-10; live IG/Razorpay **NOT_RUN** / `PROVIDER_DEFERRED` |
| frontend lint | PASS | RUN 4 + clone |
| backend lint | PASS classified | prettier 712 **accepted** this freeze (do not `--fix`). Canonical: backend-v2 `10-remaining-gates.md` |
| clean worktrees | NOT_CLAIMED | do not commit `tmp-*` / OTP logs |
| local/remote checkpoint equality | dual-push product pair BE `bae19de` / FE `628eb6d`; amendment package BE `47011cad` / FE `bc3f251`; freeze branch only; not `development`/`main` |

`PASS — MVP_CANONICAL_APPLICATION_FREEZE_V1` is still forbidden.

Remaining after this amendment: next dummy_tcs-accepted module pull (C-06 / INV-08), live IG/Razorpay (`PROVIDER_DEFERRED` / INV-10), AWS deploy downstream.
