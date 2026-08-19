# Collaboration Phase G — G0.0 Baseline Freeze

**Status:** COMPLETE WITH APPROVED BASELINE ADAPTATION  
**Captured:** 2026-08-14  
**Scope:** G0.0 + G0.1 source audit only

## 1. Baseline decision

The supplied Phase G package assumes three disposable clone checkouts. This
developer workspace instead audits the repositories that will later run and
deploy:

- canonical product authority: frozen `dummy_tcs` worktree;
- frontend implementation reality: developer-owned frontend-v2;
- backend runtime authority: developer-owned backend-v2.

Product/developer direction in this session explicitly approved auditing the
developer repositories rather than creating separate frontend/backend clone
folders.

No Collaboration runtime source is modified in G0. Only the two Phase G audit
documents are created on the frontend Phase G branch. A docs-only Phase G
commit is expected for Product handoff; no merge.

## 2. Repository refs

### Canonical / governance

- Repository: `Piyush1087/dummy_tcs`
- Frozen SHA: `b4ae5bd56388bf022190e5e416cdfc1da80ccd56`
- Audit checkout:
  `D:\Work\cursor-repos\dummy_tcs-phase-g-canonical`
- Checkout mode: detached worktree at the exact frozen SHA
- Audit worktree status: clean
- Baseline verification: PASS

The existing developer `dummy_tcs` checkout was not moved because it contained
a pre-existing modification to `production-integration/manifest.md`. A clean
detached worktree was created from the frozen SHA so the unrelated work was not
disturbed.

The frozen worktree contains:

- `AI_ENGINEERING_STANDARD.md`
- `docs/engineering/PHASE_G_PRODUCT_READINESS_STANDARD.md`
- `collaboration/phase_g/agent_context_manifest.md`
- `collaboration/phase_g/developer_bootstrap_package.md`
- all five Collaboration contracts;
- canonical backend command/read/schema references;
- all seven canonical frontend Collaboration references.

### Frontend implementation

- Repository: developer-owned `creator-commerce-frontend-v2`
- Starting developer ref:
  `feature/collab-clone-reconcile-fe`
- Phase G branch: `phase-g/collaboration-g0-audit`
- Current SHA: `a5afe7adf320c25cc3e8239e587e153bcf03703b`
- Frozen clone evidence:
  `39510031066c44f20d59d1375c01678f34e585f8`
- Working tree before G0 docs: clean
- Baseline verification: PASS WITH APPROVED ADAPTATION

The developer SHA is not a Git descendant of `3951003`; the clone feature was
reconciled into the developer repository rather than merged with clone
history. A file-by-file hash audit found all 30 files under
`src/features/collaboration/` byte-identical to `3951003`. The developer tree
also contains the real routes, app shell, environment handling and Aurora
implementation that will ship. This is why it is the correct Phase G reality
baseline.

### Backend runtime

- Repository: developer-owned `creator-commerce-backend-v2`
- Branch: `feature/collab-clone-reconcile-be`
- Current SHA: `0385c8a06abed604402621c1a3e94ee1c4e6d0e6`
- Frozen clone evidence:
  `13ce652f432560a91dde1f75ca9a21dfa76d054f`
- Working tree: clean
- G0 mode: read-only
- Baseline verification: PASS WITH RECONCILIATION TRACE

The developer SHA is a reconciliation commit, not a descendant merge of the
clone SHA. The canonical Collaboration command/controller/read-model surface
is clone-equivalent. Developer-specific deltas preserve existing Campaign
Phase 1–3 schema/history, handle-based Creator linkage, pricing, Escrow and
SST deployment ownership.

## 3. Authority hierarchy

Use the following precedence for this audit:

1. explicit approved Product decision for this task;
2. frozen Collaboration contracts at `dummy_tcs@b4ae5bd`;
3. detailed Brand/Creator workflow documents in backend-v2;
4. canonical executable/reference contracts in frozen `dummy_tcs`;
5. developer backend runtime at `0385c8a`;
6. developer frontend runtime at `a5afe7a`;
7. clone/reconciliation notes and historical implementation evidence;
8. Stitch for later composition reference only;
9. AI preference.

The module README also declares later financial and execution overlays above
stale lower-level contract wording. Where the two written hierarchies appear
different, the exact sources must be named rather than silently selecting a
new policy.

## 4. Module entry points

### Frontend routes

- Brand operational Collaboration:
  `/brand/collaborations`
- Creator operational Collaboration:
  `/creator/collaborations`
- Legacy/ambiguous Brand route requiring Product review:
  `/brand/collaboration-page`

Both operational routes mount the shared
`CollaborationWorkspace`. The third route currently mounts a public Brand
landing/preview workspace and conflicts with a canonical implementation-map
instruction to rewire `brand-collaboration-page.tsx`.

Deep-link query compatibility:

- `?thread=<collaborationId>`
- `?collaboration=<collaborationId>`

### Backend base paths

- HTTP: `/api/v1/collaboration`
- Socket.IO namespace: `/collaboration`

Primary read paths:

- `GET /threads`
- `GET /threads/:collaborationId`
- `GET /threads/:collaborationId/messages`

Commands are thread-scoped POST routes and use `commandId` plus
`expectedAggregateVersion`, except messaging/profile compatibility endpoints.

## 5. Actors and access model

- Primary actors: Brand and Creator.
- System and Admin are trusted backend actor classes for deadline, settlement,
  reveal and resolution behavior; they are not ordinary frontend actors.
- Frontend routes currently require authentication but are not role-gated.
- Backend thread access verifies the current Brand/Creator owns the
  Collaboration projection.
- Wrong ownership and missing Collaboration both resolve to HTTP 404.
- Unsupported actor/command role resolves to 403.
- Domain/stale command conflicts resolve to 409 with a command error code.

The frontend currently defaults an unresolved session role to Brand. This is
audit evidence, not accepted Product behavior.

## 6. Runtime architecture

### Persisted reconstruction

Persisted HTTP reads are the reconstruction authority:

1. list threads;
2. select/deep-link a Collaboration;
3. fetch detail and messages;
4. render the authoritative projection;
5. attach realtime invalidation.

The frontend does not reconstruct workflow history from socket payloads.

### Realtime

- Socket namespace: `/collaboration`
- Room membership is Collaboration-scoped.
- Events contain invalidation identity/time, not authoritative workflow state.
- On event or reconnect, the frontend refetches persisted HTTP state.
- A socket outage retains hydrated data and shows a degraded notice.

### Identity

- Canonical source identity: one approved Application.
- Operational identity: `collaborationId`.
- Campaign × Creator is not uniqueness.
- Detail projection includes `sourceApplicationId`.
- Inbox projection provides `collaborationId` plus Campaign/Asset/Brief
  context, but the current row presentation does not display enough scope to
  reliably distinguish similar Collaborations.

## 7. Canonical product boundaries

- Lifecycle is separate from the five-stage execution workflow.
- Feedback is post-completion, not Stage 6.
- Backend `availableActions` is command authority.
- Pricing owns commission and geography/GST policy.
- Collaboration owns entitlement and financial resolution.
- Escrow/Payout owns money movement execution.
- Settings/Payout owns Creator bank truth.
- Campaign/Brief owns source Deliverable definitions.
- Collaboration owns locked executions, submissions and publishing evidence.
- Asset provider owns binaries; Collaboration owns logical references.
- Realtime is invalidation, not persisted truth.
- Compatibility projections may remain but must not shape canonical behavior.

## 8. Current UI/platform authority

- Pages compose the feature; the shared workspace lives under
  `src/features/collaboration/`.
- Aurora is the reusable component/token authority.
- Actual Collaboration UI uses Aurora `Button`, `TextField` and `Alert`, but
  feature CSS also implements substantial local card/input/layout styling.
- Desktop currently uses a three-pane Inbox / Chat / Execution Hub layout.
- Below 1024px it uses sequential Inbox → Chat → Execution Hub navigation.
- Stitch is not mounted or invoked in G0/G1.

## 9. Accepted validation evidence

### Frozen source-clone evidence

The handoff reports:

- backend Prisma validate/generate: PASS;
- backend Collaboration tests: 101 PASS;
- backend production build and changed-file lint: PASS;
- frontend typecheck, Collaboration lint and production Vite build: PASS;
- diff checks: PASS.

These are accepted historical clone-baseline results, not checks rerun in this
G0 task.

### Developer reconciliation evidence

Previously run in the developer repositories:

- local Prisma generate: PASS;
- eight Collaboration migrations on isolated local Docker: PASS;
- backend Collaboration `node:test`: 101 PASS / 0 FAIL;
- frontend `npm run typecheck`: PASS;
- full backend TypeScript run: inconclusive because the Windows process hung
  and was stopped.

No build, lint, database, browser or runtime checks are rerun for G0.0/G0.1.

## 10. External and deferred dependencies

- production asset upload/storage provider;
- payout/refund execution adapter;
- automatic 72-hour Production auto-approval scheduler;
- automatic 48-hour Feedback reveal scheduler;
- publishing/social verification provider;
- relationship-history context endpoint/read model;
- TDS, FX and non-India financial policy;
- detailed Admin dispute tooling;
- Pause/resume semantics and commands.

Manual payment has service-domain code but is disabled and has no public HTTP
command surface in the accepted runtime.

## 11. Environment required later (G1–G5)

G0 does not require a running application or database.

Before runtime acceptance:

- repository-compatible Node/npm;
- Docker Desktop;
- isolated PostgreSQL 16 Collaboration database;
- backend at `http://localhost:3000`;
- frontend at `http://localhost:5173`;
- deterministic Brand QA identity;
- deterministic Creator QA identity;
- local Socket.IO connectivity;
- local/test provider boundaries only.

Do not use production/dev RDS, production Postmark, live Razorpay, production
S3 or real publishing/fund movement for ordinary Phase G.

## 12. Pre-audit authority conflicts

1. The canonical implementation map and current secondary Brand route disagree
   about `brand-collaboration-page.tsx`.
2. Lower securement wording says 100% of Creator fee while the later financial
   overlay defines commercial reserve as Creator fee + pricing-owned
   commission + GST on commission.
3. Lower publishing wording conflicts with the later execution overlay for
   auto-approved, publishing-required content; the later overlay requires
   explicit Brand Authorize/Decline.
4. Lower Fulfillment documents use a second conceptual taxonomy; the later
   overlay preserves Campaign Brand Support taxonomy.
5. At audit time, the developer reconcile silently supplied
   `publishingRequired: true` when an upstream application payload omitted
   mappings, while the frozen clone required explicit applicability.

The first four have a declared later overlay but remain documentation drift.
The fifth was identified as a developer reconcile deviation and corrected
before Product handoff: approval now requires a non-empty mapping and
provisioning maps only explicit values, matching clone `13ce652`.

## 13. G0.0 conclusion

The exact canonical SHA is verified. The frozen clone SHAs are available and
traceable. Product explicitly approved auditing the developer-owned reconciled
frontend/backend because those are the future runtime/deployment candidates.

G0.0 is therefore complete with the baseline adaptation disclosed above.
