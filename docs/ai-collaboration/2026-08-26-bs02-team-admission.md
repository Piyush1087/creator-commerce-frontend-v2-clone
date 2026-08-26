# BS-02 — Team admission frontend reconciliation

Base: `development` at `cbef201c571c6493c0a83ca4a6be12963faa959d`.
Branch: `settings-mvp/bs-02-team-admission`.

The existing General page still composes the same Settings surfaces. Only Team
actions were extracted to `BrandTeamSettings`: Owner/Finance/Campaign visibility,
bounded role mutation, invitation dispatch confirmation, cancellation and revoke.
Owner targets are unavailable to Finance. Campaign Managers have no administrative
controls. Final-owner and current-user revoke controls are hidden; backend errors
remain authoritative. The nonfunctional Brand resend action was removed.

`/brand/team-invitations/accept` is a public route outside RequireAuth. The page
composes `TeamInvitationAcceptance`, which uses Aurora primitives and the current
API origin. It reads the token from a fragment (with query compatibility), clears
it from the current URL and keeps it only in component memory. POST requests use
no-store/no-referrer and do not attach an unrelated current session.

The page covers inspection, valid/expired/invalid/consumed states, password and
confirmation for new users, existing-account acceptance, submitting/error and
accepted states. It uses `saveAuthSession` and `AUTH_ROUTES.brandDashboard`; there
is no separate auth storage or redirect mechanism. A reload after URL clearing
requires reopening the email link. Lost success responses require normal sign-in.

Invitation create success requires the backend's `delivery_status: DISPATCHED`.
This confirms provider acceptance, not inbox delivery. Recipient email, Brand,
role and expiry are presentation data; the client cannot change acceptance scope.

Tests use existing Vitest plus development-only jsdom and Testing Library for
real component interactions. No new production dependencies. Test requests and
account data are synthetic; no live Postmark or production backend calls.

Validation commands:

```text
npm test -- src/features/settings --maxWorkers=2 --minWorkers=1
npm test -- --maxWorkers=2 --minWorkers=1
npm run build
npm run typecheck
git diff --check
```

Run scoped ESLint on changed TypeScript/TSX files. Responsive checks cover 375px,
767px and desktop. Team retains existing table-to-card and Aurora drawer behavior;
the public form stacks with full-width mobile actions. No Stitch, Settings
redesign, General polish, financial policy change, password-change capability,
or BS-10 design reconciliation is included.
