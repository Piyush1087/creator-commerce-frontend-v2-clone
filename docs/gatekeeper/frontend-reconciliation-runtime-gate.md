# Codex Prompt — Gatekeeper v1 Frontend Reconciliation Runtime Gate

You are the runtime-validation and correction worker for the Gatekeeper v1 frontend reconciliation.

## Repositories / authority

Frontend:

`Piyush1087/creator-commerce-frontend-v2-clone`

Work only on:

`phase-g/gatekeeper-frontend-reconciliation-4`

Do not modify `development`.

Frontend baseline before reconciliation:

`591abd3ad51c7d763df9e4c71b1998e2bba52d09`

Canonical Stitch artifact package:

`Piyush1087/dummy_tcs@bb158e88ea47efd4c2d53036b94c9d1c8f3534ba`

Interpret Stitch using only:

- `docs/stitch-design-library/artifacts/gatekeeper/frontend-handoff.md`
- `docs/stitch-design-library/artifacts/gatekeeper/reconciliation-ledger.md`
- the allowlisted 8 PNG/HTML references

Stitch is visual reference only. Do not import generated HTML as production source.

Canonical Gatekeeper frontend authority:

- `Piyush1087/dummy_tcs/frontend/gatekeeper/gatekeeper_frontend_state_contract.yaml`
- `Piyush1087/dummy_tcs/frontend/gatekeeper/gatekeeper_screen_interaction_contract.md`

Backend/IE runtime authority:

`Piyush1087/creator-commerce-backend-v2-clone`

Reference runtime-integration commit:

`70da46489beb3babf4109a82516b41c7dc2f2715`

Authoritative Industry confirmation endpoint:

`POST /api/v1/discovery/:leadId/confirm-industry`

## Current intended frontend scope

The branch should implement only:

Homepage URL entry
→ frontend UX validation
→ Gatekeeper resolve/validate
→ canonical outcome/action-driven recovery
→ ADMITTED
→ single pre-scan confirmation modal
→ authoritative Industry confirmation
→ supported override / unsupported confirmation
→ Start Brand Intelligence Scan
→ handoff into existing Surface execution

Detailed Surface progress redesign is OUT OF SCOPE.

Do not reopen Product, Intelligence, Stitch, or state-architecture decisions.

## Important known integration details

Canonical validate DTO uses these exact backend fields:

```text
url
ownershipAuthorizationAttested: true
termsAccepted: true
privacyPolicyAccepted: true
termsVersion: string
privacyPolicyVersion: string
```

The frontend currently uses temporary MVP placeholders:

```text
termsVersion = draft-2026-08-20
privacyPolicyVersion = draft-2026-08-20
```

These values are intentionally temporary until formal legal documents are published. Do not block this gate merely because they are placeholders.

`/terms` and `/privacy` are intentionally placeholder frontend pages for MVP testing.

Canonical responses must drive `recovery_actions[]`; do not invent default actions for canonical result shapes. A compatibility adapter may derive actions only for explicitly legacy response shapes that do not carry canonical actions.

`REQUEST_CLASSIFICATION_REVIEW` must render/execute only when:

```text
manual_review_eligible === true
AND
recovery_actions includes REQUEST_CLASSIFICATION_REVIEW
```

Supported Industry disagreement is not the same as `REQUEST_CLASSIFICATION_REVIEW`.

## Task

### 1. Inspect first

Inspect the full diff from baseline to current branch.

Read in full at minimum:

- `src/features/brand-onboarding/api/gatekeeper-client.ts`
- `src/features/brand-onboarding/contracts/gatekeeper.contracts.ts`
- `src/features/brand-onboarding/schemas/gatekeeper-runtime-schema.ts`
- `src/features/brand-onboarding/schemas/url-schema.ts`
- `src/features/brand-onboarding/mappers/map-gatekeeper-result.ts`
- `src/features/brand-onboarding/components/landing-url-capture.tsx`
- `src/features/brand-onboarding/components/gatekeeper-confirmation-modal.tsx`
- Gatekeeper reconciliation CSS
- relevant existing landing-page composition
- existing Surface scan route/start contract
- all new Gatekeeper tests

Inspect the executable backend Gatekeeper controller/DTO/service at the runtime authority ref and verify the exact response shape of:

- `/api/v1/discovery/resolve`
- `/api/v1/discovery/validate`
- `/api/v1/discovery/:leadId/confirm-industry`

Do not assume the frontend parser matches; prove it.

### 2. Correct only bounded implementation defects

You MAY correct frontend implementation defects required to make the frozen contract executable.

Examples:

- request-field mismatch;
- response-parser mismatch;
- TypeScript/build errors;
- stale legacy orchestration still visible or executing;
- incorrect recovery-action gating;
- duplicate Gatekeeper modals;
- broken Surface-start handoff;
- invalid session assumptions;
- accessibility defects in the reconciled Gatekeeper components;
- responsive defects relative to accepted Stitch references;
- tests that fail because the implementation contradicts frozen authority.

You MUST NOT:

- change product/admission semantics;
- create new business outcomes;
- add new supported Industries;
- redesign detailed Surface progress;
- modify backend semantics merely to fit frontend assumptions;
- modify `development`;
- regenerate or reinterpret Stitch.

If a required backend capability genuinely does not exist, stop that path and report it precisely instead of inventing an endpoint.

### 3. Recovery capability audit

Explicitly verify executable capabilities for:

- `REQUEST_ORG_ACCESS`
- `REQUEST_CLASSIFICATION_REVIEW`
- `CONTACT_SUPPORT`

If the backend/application does not expose one, leave the frontend honest and non-successful for that path and report `BACKEND_CAPABILITY_MISSING` with exact evidence.

Do not fabricate success UI.

### 4. Run toolchain

Use the repository-supported Node/npm versions if documented; otherwise use a compatible Node 20 environment.

Run:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

If full tests are expensive, still run the full suite before final PASS.

Also run focused Gatekeeper tests directly if useful.

### 5. Runtime validation

Where local backend execution is practical, run the frontend against the authoritative Gatekeeper backend/runtime implementation and exercise at least:

1. client validation — empty URL;
2. malformed URL;
3. obvious social URL;
4. obvious marketplace URL;
5. missing ownership attestation;
6. missing Terms/Privacy acceptance;
7. ADMITTED / same supported Industry;
8. supported Industry override;
9. unsupported/Coming Soon confirmation;
10. CLASSIFICATION_UNCERTAIN with action-driven review eligibility;
11. UNSUPPORTED with action-driven waitlist where returned;
12. DOMAIN_UNREACHABLE / RETRY;
13. RESUME_AVAILABLE if fixture/support exists;
14. ORG_CLAIMED if fixture/support exists;
15. Surface-start transition after authoritative supported confirmation.

Do not redesign or validate detailed Surface progress beyond confirming the handoff starts the existing Surface execution path.

### 6. Visual/responsive/accessibility check

Compare selectively to the 8 accepted Gatekeeper Stitch references.

Check desktop and mobile for:

- compact hero scanner;
- consent hierarchy;
- lightweight processing treatment;
- inline recovery placement;
- Family B canonical recovery composition;
- single confirmation modal / mobile sheet;
- Change affordance;
- Industry exception hierarchy;
- no extra Gatekeeper route/page;
- no developer Identity dry-run visible in normal homepage UX;
- keyboard/focus behavior;
- modal focus entry/trap/restoration;
- accessible validation/status semantics;
- usable touch targets.

Do not chase pixel identity where the reconciliation ledger says Stitch is non-authoritative.

## Required output

Return this exact report structure:

```text
GATEKEEPER_FRONTEND_RUNTIME_GATE
branch: phase-g/gatekeeper-frontend-reconciliation-4
starting_sha: <sha>
final_sha: <sha>
status: PASS | PASS_WITH_CORRECTIONS | FAIL | BLOCKED

changes_made:
- <file + purpose>

backend_contract_verification:
resolve: PASS | FAIL
validate: PASS | FAIL
industry_confirmation: PASS | FAIL
notes:
- ...

recovery_capabilities:
REQUEST_ORG_ACCESS: WIRED | BACKEND_CAPABILITY_MISSING | FAIL
REQUEST_CLASSIFICATION_REVIEW: WIRED | BACKEND_CAPABILITY_MISSING | FAIL
CONTACT_SUPPORT: WIRED | BACKEND_CAPABILITY_MISSING | FAIL

validation:
typecheck: PASS | FAIL
focused_tests: <passed/total or FAIL>
full_tests: <passed/total or FAIL>
build: PASS | FAIL
runtime_paths: PASS | PARTIAL | FAIL | NOT_RUN
accessibility: PASS | PASS_WITH_CORRECTIONS | FAIL
responsive_visual: PASS | PASS_WITH_CORRECTIONS | FAIL

remaining_blockers:
- <none or exact blocker>

merge_readiness:
READY_FOR_FINAL_FE_REVIEW | NOT_READY
```

Commit bounded corrections to the same reconciliation branch. Do not merge to `development`.
