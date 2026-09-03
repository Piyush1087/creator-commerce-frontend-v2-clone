# C-01 / C-05 clone reconcile (frontend)

Date: 2026-09-03
Branch: `feature/c01-c05-creator-integration` (from origin `development` @ Settings MVP PR #21)
Frozen source: clone `development` @ `323658d4b147b95b5629ff8d91fa90b8fe9077e4`
C-01 ancestor: `b50c36fd4b99b6e0ec0718291d794d7a58353f4c`

## Source of truth

- Executable C-01 Entry UI + C-05 Creator shell/Settings: frozen clone SHA above
- Handoffs live in backend-v2 `docs/ai-collaboration/c01-*` and `c05-*`
- Do **not** merge clone `development` wholesale

## Integration scope (code port)

- Creator Entry client/view/platform guard under `src/features/creator-onboarding`
- C-05 actor context, Settings shell, Account/Profile/Team/Instagram/Payouts
- Creator shell nav: Home / Campaigns / Collaborations / Creator Center / Payouts / Settings
- Marketplace left as dormant compatibility routes, removed from authenticated nav
- Callback facade at `/creator-marketplace/callback`

## Preserve on origin

- Brand Centre / Product Intelligence offering routes
- Brand Settings routes and Brand shell items
- Collaboration / UCE / payouts hubs
- `AGENTS.md`, Aurora layout rules

## Origin audit

Handoffs live on backend `docs/ai-collaboration/c01-*` and `c05-*` as clone
reference copies. Origin test/build results: backend
`docs/handoff-audit/creator/` (`origin-run-log.md`, each module's
`automated-test-results.md`). Local UI packet:
`docs/handoff-audit/creator/ui-verification.md`. Commands:
`docs/handoff-audit/creator/commands-to-run.md`.
