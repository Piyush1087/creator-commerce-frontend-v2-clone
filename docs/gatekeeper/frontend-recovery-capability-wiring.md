# Gatekeeper v1 — Final Frontend Recovery Capability Wiring

Status: EXECUTION PROMPT

## Authority pins

Frontend repository: `Piyush1087/creator-commerce-frontend-v2-clone`

Frontend branch: `phase-g/gatekeeper-frontend-reconciliation-4`

Starting frontend authority commit: `1d6467532653aa5dbe4257b02b61379dfa3d1394`

Backend executable authority repository: `Piyush1087/creator-commerce-backend-v2-clone`

Backend recovery-capability commit: `14ecfabd86a5751d128371910202d9f2d726282f`

Canonical product/frontend authority repository: `Piyush1087/dummy_tcs`

Canonical Stitch artifact package: `bb158e88ea47efd4c2d53036b94c9d1c8f3534ba`

The Gatekeeper frontend reconciliation and runtime gate are already accepted. Do not reopen product, state, Stitch, Aurora, Industry-confirmation, or Surface-start decisions.

## Task

Wire the three backend capabilities introduced at backend commit `14ecfabd86a5751d128371910202d9f2d726282f` into the existing accepted Gatekeeper frontend.

Only these capabilities are in scope:

1. `REQUEST_ORG_ACCESS`
2. `REQUEST_CLASSIFICATION_REVIEW`
3. `CONTACT_SUPPORT`

Do not redesign the recovery UI. Reuse the existing Family B composition and action dispatcher already present on the frontend branch.

## Backend contracts

### REQUEST_ORG_ACCESS

Endpoint:

`POST /api/v1/discovery/:leadId/request-org-access`

Body:

```json
{
  "requesterEmail": "user@example.com",
  "authorizedRepresentativeAttested": true,
  "requesterName": "optional",
  "requesterNote": "optional"
}
```

Success: HTTP 201

```json
{
  "request": {
    "id": "uuid",
    "type": "REQUEST_ORG_ACCESS",
    "status": "RECEIVED",
    "discoveryLeadId": "uuid",
    "normalizedDomain": "example.com",
    "submittedAt": "ISO-8601"
  }
}
```

Duplicate retries are idempotent and return the same durable request.

The frontend must not imply that access has been granted. Successful copy should communicate that the access request was received/submitted.

### REQUEST_CLASSIFICATION_REVIEW

Endpoint:

`POST /api/v1/discovery/:leadId/request-classification-review`

Same request body and response structure as above, with response type `REQUEST_CLASSIFICATION_REVIEW`.

The action may only be rendered/invoked when the current canonical Gatekeeper result includes `REQUEST_CLASSIFICATION_REVIEW` and `manual_review_eligible=true`.

Do not derive eligibility from `industry_disagreement_flag`, Industry override state, reason copy, or frontend policy.

Successful copy should communicate that a user-initiated classification review request was received/submitted. Do not imply the classification has been changed or accepted.

### CONTACT_SUPPORT

Endpoint:

`GET /api/v1/discovery/support`

Success:

```json
{
  "support": {
    "type": "URL",
    "href": "https://configured-support-destination.example/path"
  }
}
```

Missing/invalid runtime configuration returns HTTP 503 with code `GATEKEEPER_SUPPORT_NOT_CONFIGURED`.

On success, navigate/open the returned canonical URL. Do not hardcode a support URL or email in the frontend.

On configuration failure, show honest inline feedback and do not invent a destination.

## Required frontend work

### API client

Extend the existing Gatekeeper API client with narrowly typed functions for:

- request organization access;
- request classification review;
- fetch canonical Gatekeeper support destination.

Reuse the existing HTTP-error infrastructure.

Validate response shapes at the frontend boundary sufficiently to fail safely on malformed responses. Do not add business authority to the parser.

### Recovery dispatcher/UI

Update the existing recovery action handling so:

- `REQUEST_ORG_ACCESS` uses the real backend capability;
- `REQUEST_CLASSIFICATION_REVIEW` uses the real backend capability;
- `CONTACT_SUPPORT` resolves the real canonical destination and navigates to it;
- existing `JOIN_WAITLIST`, `RETRY`, `SIGN_IN`, `VERIFY_DOMAIN`, `RESUME` behavior is not regressed.

For the two request actions, preserve the current inline email expansion. The existing authorization-attestation checkbox must be enforced before sending `authorizedRepresentativeAttested: true`.

If no `leadId` exists, fail locally with a truthful retry/session-context message; do not call a guessed endpoint.

Keep idempotent retries safe: a repeated click/submission may call the endpoint again, but the frontend must not create local duplicate semantics or claim multiple requests were created.

After success, keep the durable success message visible and do not automatically move the user to another Gatekeeper state.

### Tests

Add focused tests that prove at minimum:

1. organization-access request endpoint/path/body are exact;
2. classification-review request endpoint/path/body are exact;
3. classification review is not exposed/invoked when `manual_review_eligible=false` even if an inconsistent action appears;
4. support uses GET and consumes the returned URL;
5. malformed support response fails safely;
6. 503 support configuration failure surfaces honest feedback;
7. successful org-access copy does not claim access was granted;
8. successful classification-review copy does not claim classification was changed;
9. existing Gatekeeper client tests continue to pass.

## Validation

Docker is available locally now.

Run:

- dependency install only if needed;
- TypeScript/typecheck;
- focused Gatekeeper tests;
- full frontend tests;
- production build;
- changed-file lint;
- backend-connected or authority-shaped runtime verification for all three newly wired capabilities;
- a focused desktop/mobile accessibility sanity pass for the recovery expansion after success/error states.

Use backend commit `14ecfabd86a5751d128371910202d9f2d726282f` as the executable contract source. If practical, boot the backend with Docker/Postgres and exercise the real endpoints. Do not weaken tests or contracts merely to make the gate pass.

## Scope exclusions

Do not:

- modify backend code;
- modify `dummy_tcs` authority;
- change Gatekeeper outcome vocabulary;
- change recovery eligibility;
- change Industry confirmation semantics;
- change supported/Coming Soon Industry taxonomy;
- alter Surface Intelligence behavior;
- redesign Stitch/Aurora composition;
- import Stitch HTML;
- merge into `development`.

If a genuine contract mismatch is discovered, stop and report it rather than inventing frontend behavior.

## Commit

Commit any necessary frontend corrections to the existing branch only:

`phase-g/gatekeeper-frontend-reconciliation-4`

Do not merge `development`.

## Required final response

Return exactly this structure:

```text
GATEKEEPER_FRONTEND_RECOVERY_WIRING_GATE
branch: phase-g/gatekeeper-frontend-reconciliation-4
starting_sha: <sha>
final_sha: <sha>
backend_authority_sha: 14ecfabd86a5751d128371910202d9f2d726282f
status: PASS | PASS_WITH_CORRECTIONS | FAIL | BLOCKED

wiring:
REQUEST_ORG_ACCESS: PASS | FAIL
REQUEST_CLASSIFICATION_REVIEW: PASS | FAIL
CONTACT_SUPPORT: PASS | FAIL

behavior:
org_access_success_copy_authority_safe: YES | NO
classification_review_user_initiated_semantics_preserved: YES | NO
support_destination_backend_authoritative: YES | NO
manual_review_guard_preserved: YES | NO

validation:
typecheck: PASS | FAIL
focused_tests: <x/y>
full_tests: <x/y>
build: PASS | FAIL
changed_file_lint: PASS | FAIL
runtime_endpoints: PASS | PARTIAL | NOT_RUN
accessibility: PASS | PASS_WITH_CORRECTIONS | FAIL
responsive: PASS | PASS_WITH_CORRECTIONS | FAIL
docker_used: YES | NO

remaining_blockers:
- <none or exact blockers>

merge_readiness:
READY_FOR_FINAL_INTEGRATION | NOT_READY
```
