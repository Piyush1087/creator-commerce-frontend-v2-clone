# Creator Commercial Setup V0 frontend intake and test harness

Authority: Work Preferences V2 and Rate Card V2, original autonomous P0–P4 prompt, Amendments 1/2 and Recovery 2 in the program authority repository. Aurora v5 and existing Creator Centre AppShell are reused; no second shell, sixth bottom item, source-access gate, package price, UGC rate or manual currency input.

One authenticated `/creator/commercial-setup` workspace contains accessible anchor navigation and two independent canonical forms. API clients strictly validate commands/consumers, use the existing authenticated-fetch contract and `no-store`, and never render diagnostic payloads. Owner/Manager edit; Assistant reads only. Country/currency transitions are server-owned. Drafts survive failures/conflicts; a latest-state review fence precedes retry. Cross-currency manual changes with existing money require the existing Aurora SideDrawer confirmation.

Industry outline buttons use the approved `--text-high` token in this feature only after Axe detected the inherited outline text color was below contrast acceptance. No global Aurora token/component policy changed. Cards, controls, responsive shell and dialog focus mechanics remain existing Aurora primitives.

Tests: `npx vitest run --config vitest.config.ts src/features/creator-commercial-setup`; full regression uses process-only `VITE_API_URL=''` because existing Gatekeeper tests assert relative endpoint URLs. Production preview instead uses the ignored local API configuration.

Test-only scripts are not imported into production:

- `p3-commercial-browser-fixtures.ts`: requires explicit fixture opt-in, an exact loopback task database and synthetic password configuration; rejects existing prefixed users. Uses accepted password hashing, canonical repositories and active Team membership. No production auth bypass.
- `p3-commercial-browser-proof.mjs`: real password login/session refresh and existing JWT headers in memory, installed Edge, production frontend/local backend, four widths, all three roles and bank states, keyboard/focus/overflow/Axe/console checks. External provider destinations are denied. No token, browser state, screenshot, raw response or credentials are saved.
- `p3-commercial-db-proof.mjs`: exact task route/prefixed-owner guard; selects non-secret canonical fields/counts only, or invokes internal exact-owner purge. Synthetic bank mutation helper is fixture-only, never a production route.

Configuration names only: `DATABASE_URL`, `CREATOR_COMMERCIAL_BROWSER_FIXTURE`, `CREATOR_COMMERCIAL_BROWSER_PASSWORD`, `CREATOR_COMMERCIAL_BROWSER_PROOF`. Mandatory browser fixtures have zero Instagram/source connections. No dependency, provider scope, public Instagram contract or Campaign/Collaboration/payout implementation change.
