# BS-06: Instagram Settings callback and lifecycle

Base: `program/brand-settings-mvp` at
`6e7183045f6f3f5c9383bdcc8ca89936e5ba497e`, fetched and verified before changes.

The existing integration feature and Aurora primitives are retained. Callback
POST now includes code, state and the exact initiation redirect URI. Missing
state and provider denial fail locally without a connect request. The server
remains the sole state authority. Callback parameters are removed before async
work on success, denial, missing-state, backend and network failures; unrelated
query/hash and router history state are preserved. Component-local promise reuse
prevents React StrictMode effect replay from issuing a second one-time POST.
Initial load/connect requests omit the referrer so callback query secrets are not
forwarded in request headers; OAuth-start requests also disable browser caching.

Connect, partial/full connection, expired-token re-authentication, manage,
reconnect and both identity-conflict decisions remain. No provider tokens or
OAuth state are put into browser persistent storage. The state exists briefly
in component memory for submission and is not logged.

Meta Business Suite card/CTA and its invitation text are removed from MVP.
The compatibility action `DELETE_INGESTED_DATA` now appears as “Disconnect and
remove connection credentials”. Both action context and success wording state
that historical analytics, Intelligence and campaign evidence remain. No purge
is claimed and no historical deletion exists.

BOUNDED_CORRECTION in the paired backend: a mismatch during an active reconnect
stores the incoming encrypted credentials separately until explicit overwrite.
Cancelling preserves the canonical handle and prior active connection. A
first-time mismatch remains disconnected until accepted.

Mobile changes are restricted to the Instagram feature wrapper and conflict
panel: wrapping labels, full-width mobile actions, a scrolling conflict panel
and bottom-navigation clearance. The manage drawer uses the existing Aurora
component and has an explicit accessible close label. No shell or design-system
changes, page redesign, Stitch or other Settings work is introduced.
The identity dialog focuses its first action and wraps Tab/Shift+Tab within the
decision controls, restoring prior focus on close.

Run bounded and broader Vitest, build, typecheck, scoped ESLint and diff checks.
Component tests use synthetic responses only. Local visual validation uses the
actual component with a temporary fake transport, never a live provider.

Recorded final results:
- `npm test -- src/features/settings --maxWorkers=1 --minWorkers=1`: 40 passed,
  including 23 Instagram tests.
- `npm test -- --maxWorkers=1 --minWorkers=1`: all 259 tests in 40 files passed.
- `npm run build`, `npm run typecheck`, scoped ESLint and `git diff --check`:
  passed. Vite retains its existing large-chunk warning.
- Local browser checks at 375, 767 and 1280px: no page overflow; expired-token
  actions, manage wording and mobile conflict controls were rendered. Keyboard
  focus starts on Cancel and Shift+Tab wraps to Overwrite. The temporary visual
  harness was removed; no test route or fake transport ships with the feature.
