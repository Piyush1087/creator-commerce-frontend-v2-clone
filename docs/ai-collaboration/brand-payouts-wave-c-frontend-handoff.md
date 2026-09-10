# Brand Payouts Wave C frontend completion handoff

Status: `PASS`

This closes `BRAND_PAYOUTS_WAVE_C_RESERVE_READ_CONTRACT_CORRECTION_AND_CONTINUATION_V1` and supersedes the preflight blocker at `460282d9634d0c3d4cf3767df8a4a72459aa57c8`.

## Binding and backend correction

- Backend branch: `brand-payouts/wave-c-reserve-read-v1`
- Backend SHA/tree: `a38102fd9662f1654c9572b19913b9e228385b73` / `adb8c129744dc5e9574328a75e59d802728bbe37`
- Backend parent: `46c71fd554d7621d9bd13d1bbc3115646a7c56bd`
- Frontend branch/parent: `brand-payouts/wave-c-frontend-v1` / `460282d9634d0c3d4cf3767df8a4a72459aa57c8`
- Accepted P3A source base: `7c75a4c8f5a0df3a1fb82d2f707b1c6b03d56d2a`
- Migration count: 86; no migration changed. Migration 86 SQL SHA-256: `887e5bb6bd262a4dd02e42a798db55bd136d97bf6a923df7e6466573f11d1f84`.

The backend now projects canonical C04 reserve instructions with fixed-as-of pagination/filtering, distinct public request reference, server-owned `reserve_instruction_id`, and `reserve-instruction:vN` version. `APPROVE_RESERVE` appears only for current Owner/Finance viewers on an eligible current unsuperseded instruction. Campaign Manager receives no row, amount, or action. Transactional scope, membership, currentness, supersession, economics, and idempotency revalidation remain authoritative.

Backend proof passed: 4 files / 28 tests, scoped ESLint, Prisma validate, Nest build, root/health/database startup smoke, and disposable PostgreSQL 0→86. It covered Owner/Finance, Campaign denial, cross-Brand isolation, concurrent replay/exactly-one effect, insufficient funds, C05/P5 fencing, and provider-disabled/test-neutral boundaries. Remote fetch-back matched and the worktree was clean.

## Frontend and automated gates

Wave C consumes only server-emitted action/ID/version/as-of. It displays persisted amount without an editable amount, hides financial data/actions for Campaign Manager, and uses a stable per-dialog UUID idempotency key. The drawer preserves native submit semantics, announces pending via `aria-disabled`, deduplicates activation, traps focus, restores the invoker on Escape, and refocuses the command on errors. Responsive behavior switches at 768px.

- Focused sweep: 4 files / 63 tests passed.
- Scoped lint and TypeScript: passed.
- Full suite: 114 files / 895 tests passed.
- Corrected production build: 2,111 modules; 0.51 kB HTML, 437.44 kB CSS, 1,205.42 kB JS. The inherited >500 kB advisory is non-blocking.

## Built-stack browser evidence

The exact builds ran on loopback through a disposable static/API proxy and owned PostgreSQL 16. Refresh-cookie rotation authenticated disposable fixtures.

| Width | Viewer | Result |
| ---: | --- | --- |
| 390 | Owner | exact ₹118 action; no overflow; drawer keyboard path; repeated Enter yielded one approval/effect; ₹118 protected success |
| 1440 | Finance Admin | exact ₹118 action; no overflow; Escape restored invoker; keyboard submit yielded one approval/effect |
| 767 | Campaign Manager | read-only; no protected amount, row, or command; no overflow |
| 768 | Campaign Manager | breakpoint edge remained fail-closed with no overflow |
| representative | unauthenticated | `/brand/payouts` redirected to `/login` |

Database verification found exactly one approval per exercised instruction. A fresh corrected-build tab had zero console warnings/errors. Axe 4.10.3 reported serious 0, critical 0, and three inherited moderate shell-landmark findings (`landmark-main-is-top-level`, `landmark-no-duplicate-main`, `landmark-unique`). CUA supplied live screenshots and AX/DOM snapshots; its browser bridge exposed no repository-safe screenshot sink, so no screenshot file is fabricated.

## Decision register and disclosures

- `CLASS_B_FIXED`: completed the bounded reserve read/action contract with no economics, policy, or migration change.
- `CLASS_A_FIXED`: updated one existing P2 mock order for the new parallel read.
- `PREPARED_ENV_FIXED`: an initial passing packaging command lacked local `VITE_API_URL` and rendered blank. It was not accepted. The corrected build used `VITE_STAGE=local` and `VITE_API_URL=http://127.0.0.1:4173`; this second packaging attempt is disclosed as a cadence exception.
- `NETWORK_DISCLOSURE`: an earlier populated-database startup processed queued test notifications and made rejected Postmark calls using a deliberately invalid token. No payout-provider method/action or financial-provider request occurred. Recipients were cleared before the accepted browser stack.
- `AXE_MODERATE_ACCEPTED`: three inherited moderate landmark findings; serious/critical zero.

No provider credential was present, no payout-provider action occurred, and no production/AWS/non-disposable database was mutated. Wave D, P6, P3S, generalized P4R/P5R, canonical merge, and deployment remain deferred.
