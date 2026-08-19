# Collaboration Phase G — G0.1 Whole-Module Reality Audit

**Status:** COMPLETE FOR SOURCE-LEVEL G0.1  
**Audited:** 2026-08-14  
**Actors:** Brand and Creator  
**Runtime execution:** Not required and not performed  
**G0 audit source changes:** None  
**Post-audit correction:** COL-G0-005 was corrected before Product handoff

## 1. Executive reality summary

The accepted Collaboration frontend is not a legacy six-stage screen. Its core
runtime architecture is substantially reconciled:

- Brand and Creator share one operational workspace;
- persisted HTTP data reconstructs list, detail and messages;
- realtime only invalidates and refetches;
- lifecycle and execution stage are separate;
- `availableActions` drives most execution controls;
- Negotiation supports one Brand counter;
- Fulfillment comes from projected Brand Support type;
- Production, revision history, Publishing and compliance are per Deliverable;
- auto-approval does not itself authorize Publishing;
- Settlement presentation is separate from entitlement;
- Feedback is post-completion and double-blind;
- terminal resolution and residual settlement remain visible.

However, source-level G0 found material Product-readiness gaps that ordinary
typecheck/build validation would not expose:

- actor routes are not role-gated and an unknown role defaults to Brand;
- an invalid/no-access deep link silently opens a different Collaboration;
- inbox rows do not present enough source scope to distinguish similar
  Application-origin Collaborations;
- API responses are asserted rather than runtime-validated;
- the audit found an upstream silent `publishingRequired` default; this was a
  developer reconcile deviation and was corrected to match the frozen clone
  before Product handoff;
- Creator cancellation is projected but not rendered;
- Fulfillment issue reporting hardcodes one issue code;
- counterpart context is largely placeholder/debug acceptance UI;
- Creator bank mutation still leaks through Collaboration ownership;
- read errors, unauthorized/not-found, empty chat and degraded recovery are
  incomplete;
- a second Brand route conflicts with canonical routing guidance;
- mobile shell access and feature CSS need later functional/visual review.

G0.1 does not prescribe the G1 split. It identifies root-cause clusters for
Product to select for G0.2.

## 2. Current route and workspace topology

### Operational routes

| Actor | Route | Page | Workspace |
|---|---|---|---|
| Brand | `/brand/collaborations` | `src/pages/brand/collaborations/brand-collaborations-page.tsx` | shared `CollaborationWorkspace` |
| Creator | `/creator/collaborations` | `src/pages/creator/collaborations/creator-collaborations-page.tsx` | shared `CollaborationWorkspace` |

Route declarations: `src/routes/app-routes.tsx:57-104`.

### Ambiguous secondary Brand route

`/brand/collaboration-page` mounts
`src/pages/brand/collaboration/brand-collaboration-page.tsx`, which renders the
public Brand landing/preview workspace. The frozen implementation map names
this page for Collaboration workspace rewiring. This is recorded as an
authority conflict; G0 does not guess whether the route is intentionally a
different product surface.

### Workspace composition

`src/features/collaboration/components/CollaborationWorkspace.tsx` owns:

- inbox fetch/search/selection;
- `thread` and `collaboration` query compatibility;
- detail and message hydration;
- shared chat;
- counterpart drawer;
- desktop/mobile composition;
- socket invalidation/refetch;
- global read/send error notice.

`CollaborationExecutionHub.tsx` selects the canonical stage panel and gives it
backend-projected capabilities.

Desktop: three persistent panes.  
Below 1024px: sequential Inbox → Chat → Execution Hub.

## 3. Current state and ownership topology

```text
Application/Campaign/Brief/Deliverable definitions
  → locked Collaboration execution snapshot
  → backend Collaboration aggregate/read model
  → GET threads / detail / messages
  → CollaborationWorkspace and stage panels

UI command
  → commandId + expectedAggregateVersion
  → Collaboration controller
  → owning command service/guard
  → persisted state/event
  → HTTP response + socket invalidation
  → authoritative HTTP refetch
```

Ownership observed:

- Campaign/Application: source configuration and lineage.
- Collaboration: workflow, per-Deliverable execution, entitlement, resolution,
  message projection and feedback.
- Pricing/geography: commission and GST policy.
- Brand Escrow: reserve/ledger execution.
- Payout/Settings: intended Creator bank and money-movement owner.
- Asset/provider boundary: logical references only in Collaboration.
- Socket.IO: invalidation only.

## 4. Brand surface audit

### Inbox and entry

Brand sees counterpart, last-message-or-Campaign text, lifecycle/stage and
action-owner copy. It does not see Brief/Product/Deliverable scope, unread
count or last-message time even though the projection carries more context.

The Brand route is authenticated, but the frontend route is not role-gated.
Backend ownership still protects data.

### Negotiation

`components/execution/NegotiationPanel.tsx` correctly renders:

- Creator proposal;
- Brand accept or one counter;
- dynamic, backend-projected Advance protection;
- end action when capability allows;
- waiting/locked states.

No fixed 30/70 assumption was found.

### Securement

`SecurementPanel.tsx` separates:

- agreed Creator fee;
- amount to secure;
- Advance protection;
- commission and GST when projected;
- funding, processing, secured and payout-details states.

Manual payment action types remain in contracts but are intentionally dormant
in the accepted backend: capability off, no HTTP routes. This is not classified
as a missing current-MVP button without a Product decision to activate Manual.

### Fulfillment

Brand evidence fields follow projected `brandSupportType`, not industry.
Issue remediation/history exists. The report form, however, hardcodes one
disabled issue type.

### Production and Publishing

Brand receives per-Deliverable:

- append-only submission history;
- approve/revision/final-reject actions;
- two-revision presentation;
- review deadlines and auto-approval state;
- explicit publication authorization;
- evidence verification/correction.

Auto-approved content remains unauthorized until explicit Brand action.

### Context

Brand opens a Creator drawer, but it lacks the canonical profile facts and
Brand-scoped relationship history because no dedicated backend context read
exists. The UI exposes endpoint implementation status in user-facing copy.

## 5. Creator surface audit

### Inbox and entry

Creator uses the same persisted workspace and projections. Desktop sidebar
links to “Chat”; Creator mobile bottom navigation does not expose a
Collaboration/Chat entry, unlike Brand mobile navigation.

### Negotiation

Creator correctly sees waiting, one Brand counter, Accept and Decline according
to capabilities.

### Securement

Creator sees waiting/secured status and can navigate to Settings/Payout when
payout details block progress. This handoff is correct. Elsewhere, Creator
Payouts still imports a Collaboration-owned bank mutation, which violates the
same ownership model.

### Fulfillment

Creator can confirm or report an issue, view remediation history and observe
hard-stop resolution. Issue taxonomy remains frontend-hardcoded.

### Production and Publishing

Creator receives per-Deliverable submit/re-submit flows, actual Brand feedback,
version history and Publishing evidence/correction controls. No global
Collaboration-level revision/live URL authority was found.

### Cancellation

Backend projects `CancelCollaborationByCreator`, the client implements it, and
the capability map includes it. No component renders the action.

### Context

Creator opens a lighter Brand/Campaign/Brief drawer. It is mostly projection
fragments plus technical placeholder copy rather than a complete canonical
context surface.

## 6. Shared workspace and chat audit

Positive:

- detail and messages hydrate from persisted HTTP;
- old socket payloads are not replayed as state;
- selection joins/leaves Collaboration rooms;
- reconnect triggers authoritative refetch;
- degraded realtime keeps hydrated data visible;
- completed/terminal history remains readable.

Gaps:

- composer does not consume the mapped `message` capability;
- send has no busy lock, allowing repeat sends;
- chat errors share one global alert with unrelated read errors;
- an empty message history renders a blank feed;
- no manual refresh/fallback policy exists while realtime remains degraded;
- backend currently advertises and accepts posting outside ACTIVE, including
  PAUSED, while Pause command policy remains explicitly deferred.

The last point is an authority conflict pending Product policy, not a frontend
fix to infer locally.

## 7. Stage/workflow surface audit

| Surface | Current reality | G0 result |
|---|---|---|
| Negotiation | one-counter, capability-driven | materially aligned |
| Securement | Escrow/zero-cash/payout prerequisite | aligned; Manual intentionally dormant |
| Fulfillment | support-subtype projection, issue/remediation | issue code UI defective |
| Production | per Deliverable/version/revision | aligned |
| Auto-approval | completes Production only | aligned |
| Publishing | per Deliverable authorization/evidence | aligned |
| Compliance correction | separate from Production revision | aligned |
| Settlement | authoritative read-only execution state | aligned; adapter deferred |

No BARTER payment rail, industry-derived Fulfillment, global revision count,
global canonical live-post, automatic publication after auto-approval, or
compliance-triggered payout arithmetic was found.

## 8. Terminal, completion and feedback audit

`ResolutionCard` presents Cancelled/Terminated lifecycle, reason, stage,
entitlement/refund and residual settlement without assigning frontend fault.

`CompletedPanel` removes execution actions and retains summary/chat/Feedback.

`FeedbackPanel` correctly distinguishes:

- no submission;
- viewer submitted but counterpart pending;
- hidden double-blind state;
- revealed submissions;
- deadline-based reveal projection.

The frontend does not reveal Feedback on a local timer and does not treat it as
Stage 6.

## 9. Cross-cutting state audit

| State | Reality |
|---|---|
| inbox loading | present as text; no skeleton/retry |
| empty inbox | present |
| ready/no selection | present |
| detail/message hydration | partial text state |
| empty conversation | missing |
| inbox/detail/message errors | conflated global alert |
| retry | missing |
| unauthorized role | missing |
| not found/no access | missing; invalid link selects first row |
| command processing | present for execution; missing for chat |
| command error | stage-scoped for execution; global for chat |
| stale aggregate | refetch + latest-state notice |
| blocked | common Blocking Card |
| terminal | Resolution Card |
| completed | Completed Panel |
| realtime degraded | notice with data retained |
| degraded recovery | reconnect only; no manual/fallback refresh |
| refresh/re-entry | persisted HTTP hydration |
| legacy projection | typed but not visibly/diagnostically bounded |

## 10. Mobile/responsive reality

The Collaboration feature supplies the required sequential mobile flow and
full-width mobile actions. Source inspection also found:

- Creator bottom navigation lacks Collaboration/Chat;
- 768–1023px uses the mobile flow because the feature breakpoint is 1024px;
- feature CSS contains hardcoded colors, custom card/input styling, 9–13px
  text and mobile padding below current Aurora guidance.

No browser/viewport test was run. Functional mobile navigation and visual debt
must remain separate in later phases.

## 11. Finding register

### COL-G0-001

- **Surface:** Brand/Creator route access
- **Actor(s):** BOTH
- **Observed behavior:** Any authenticated token can mount either route; an
  unresolved session role defaults to Brand.
- **Expected canonical behavior:** Role-specific presentation with explicit
  no-access handling; backend remains final authorization authority.
- **Exact frontend component/file:** `src/shared/auth/require-auth.tsx:13-24`;
  `src/routes/app-routes.tsx:57-104`;
  `src/features/collaboration/components/CollaborationWorkspace.tsx:19`
- **Current frontend state/data source:** local auth session
- **Frontend API/client path:** all Collaboration reads
- **Backend endpoint/service/authority:** `CollaborationAccessService`;
  ownership mismatch returns 404, unsupported role returns 403
- **Canonical owner:** Auth/access + Collaboration projection
- **Legacy/compatibility dependency:** none proven
- **Root cause or investigation hypothesis:** INVESTIGATION REQUIRED
- **Classification:** FRONTEND_INTEGRATION_DEFECT
- **Fix scope:** role-aware route/workspace access; remove Brand fallback
- **Backend change required:** UNKNOWN
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P0
- **G0.2 investigation required:** YES

### COL-G0-002

- **Surface:** Deep link / no access
- **Actor(s):** BOTH
- **Observed behavior:** If requested `thread`/`collaboration` is absent from
  inbox results, the first available Collaboration is selected.
- **Expected canonical behavior:** Preserve requested identity and show
  `NOT_FOUND_OR_NO_ACCESS` with recovery.
- **Exact frontend component/file:** `CollaborationWorkspace.tsx:32-35`
- **Current frontend state/data source:** inbox membership
- **Frontend API/client path:** `GET /threads`
- **Backend endpoint/service/authority:** detail/read access collapses missing
  and wrong ownership to 404
- **Canonical owner:** Collaboration read/access contract
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** deterministic frontend fallback;
  final 404 flow requires trace
- **Classification:** FRONTEND_INTEGRATION_DEFECT
- **Fix scope:** model invalid/forbidden deep link separately
- **Backend change required:** UNKNOWN
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P0
- **G0.2 investigation required:** YES

### COL-G0-003

- **Surface:** Inbox identity
- **Actor(s):** BOTH
- **Observed behavior:** Row presentation shows counterpart, Campaign/message
  snippet and state but omits Product/Brief/Deliverable scope.
- **Expected canonical behavior:** Distinguish multiple Application-origin
  Collaborations without exposing internal IDs.
- **Exact frontend component/file:** `CollaborationWorkspace.tsx:58-64`
- **Current frontend state/data source:** thread projection
- **Frontend API/client path:** `GET /threads`
- **Backend endpoint/service/authority:** backend row already projects Campaign,
  Campaign Asset and Brief context; Application ID remains detail-only
- **Canonical owner:** Application lineage + Collaboration identity
- **Legacy/compatibility dependency:** legacy rows may have reduced context
- **Root cause or investigation hypothesis:** presentation gap; legacy behavior
  requires trace
- **Classification:** MISSING_UX_BEHAVIOR
- **Fix scope:** inbox identity hierarchy
- **Backend change required:** UNKNOWN
- **Stitch required:** UNKNOWN
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-004

- **Surface:** HTTP read integrity / Publishing applicability
- **Actor(s):** BOTH
- **Observed behavior:** API JSON is cast directly to TypeScript contracts. A
  malformed/missing `publishingRequired` becomes falsy in presentation.
- **Expected canonical behavior:** Reject or safely isolate an incomplete
  authoritative read model; never treat unresolved applicability as false.
- **Exact frontend component/file:** `api/collaboration-client.ts:28-39`;
  `components/publishing/PublishingDeliverableCard.tsx:22`
- **Current frontend state/data source:** unvalidated HTTP JSON
- **Frontend API/client path:** all Collaboration GETs
- **Backend endpoint/service/authority:** canonical mapper projects a required
  persisted boolean
- **Canonical owner:** locked Brief Deliverable / Collaboration snapshot
- **Legacy/compatibility dependency:** legacy payload shape
- **Root cause or investigation hypothesis:** frontend runtime boundary is
  assertion-only
- **Classification:** RUNTIME_CONTRACT_DEFECT
- **Fix scope:** executable read validation/narrowing and safe failure state
- **Backend change required:** UNKNOWN
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P0
- **G0.2 investigation required:** YES

### COL-G0-005

- **Disposition:** RESOLVED BEFORE PRODUCT HANDOFF
- **Surface:** Application → Collaboration provisioning
- **Actor(s):** BOTH
- **Observed behavior at audit time:** When approval input had no publishing
  applicability mapping, brand-uce created mappings with
  `publishingRequired: true`.
- **Current behavior:** Pipeline approval requires a non-empty explicit
  `deliverable_publishing_applicability` mapping and provisions only those
  values, matching frozen clone `13ce652`. The developer-only Applications
  approve path no longer auto-calls pipeline approve without that mapping.
- **Expected canonical behavior:** Explicit persisted applicability; unresolved
  values must fail/defer rather than silently default.
- **Exact frontend component/file:** no frontend owner
- **Current frontend state/data source:** downstream read assumes persisted fact
- **Frontend API/client path:** downstream detail read
- **Backend endpoint/service/authority:**
  `src/features/brand-uce/dto/brand-uce-pipeline.dto.ts`;
  `src/features/brand-uce/services/brand-uce-pipeline.service.ts`;
  `src/features/brand-uce/services/campaign-application.service.ts`
- **Canonical owner:** Campaign/Brief authoring and provisioning boundary
- **Legacy/compatibility dependency:** developer Applications approve bridge
- **Root cause or investigation hypothesis:** confirmed developer reconcile
  fallback, absent from the frozen clone
- **Classification:** RUNTIME_CONTRACT_DEFECT
- **Fix scope:** brand-uce provisioning validation; Applications vs pipeline
  approve ownership remains a G1/runtime concern
- **Backend change required:** COMPLETED LOCALLY (unmerged reconcile branch)
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P0
- **G0.2 investigation required:** NO for this deviation; upstream authoring
  availability and Applications→pipeline handoff UX should still be verified
  during G1 runtime preparation

### COL-G0-006

- **Surface:** Read/API errors
- **Actor(s):** BOTH
- **Observed behavior:** Inbox, detail, message and send failures share one
  persistent global string; no retry/dismiss/status-specific state.
- **Expected canonical behavior:** Recoverable pane-local read errors,
  retained hydrated state and explicit not-found/no-access.
- **Exact frontend component/file:** `CollaborationWorkspace.tsx:25,28-43,55,76`;
  `utils/parse-collaboration-api-error.ts:1-15`
- **Current frontend state/data source:** raw response/status
- **Frontend API/client path:** all reads/message POST
- **Backend endpoint/service/authority:** 400/401/403/404/409 error boundaries
- **Canonical owner:** HTTP/read contract
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** local error model too coarse
- **Classification:** MISSING_UX_BEHAVIOR
- **Fix scope:** independent error states and recovery controls
- **Backend change required:** UNKNOWN
- **Stitch required:** UNKNOWN
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-007

- **Surface:** Chat action authority
- **Actor(s):** BOTH
- **Observed behavior:** Composer is always enabled after selection and has no
  send busy lock. Backend always projects/allows message posting, including
  PAUSED/terminal lifecycle.
- **Expected canonical behavior:** History remains available; posting policy
  must follow frozen backend authority. Pause semantics are not frozen.
- **Exact frontend component/file:** `CollaborationWorkspace.tsx:55,66-69`;
  `utils/collaboration-capabilities.ts:12-30`
- **Current frontend state/data source:** selected ID + local draft
- **Frontend API/client path:** `POST /threads/:id/messages`
- **Backend endpoint/service/authority:** mapper seeds
  `PostCollaborationMessage`; service has no lifecycle gate
- **Canonical owner:** Collaboration messaging/action policy
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** competing terminal/history and
  deferred Pause policy
- **Classification:** AUTHORITY_CONFLICT
- **Fix scope:** Product freezes posting policy, then backend/FE align
- **Backend change required:** UNKNOWN
- **Stitch required:** NO
- **Product decision required:** YES
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-008

- **Surface:** Creator cancellation
- **Actor(s):** CREATOR
- **Observed behavior:** Client and capability support cancel; no UI renders it.
- **Expected canonical behavior:** Explicit cancel action where backend projects
  `CancelCollaborationByCreator`.
- **Exact frontend component/file:** `api/collaboration-client.ts:82`;
  `utils/collaboration-capabilities.ts:25-26`;
  `CollaborationExecutionHub.tsx:39-74`
- **Current frontend state/data source:** `availableActions`
- **Frontend API/client path:** `POST /threads/:id/cancel-by-creator`
- **Backend endpoint/service/authority:** `CollaborationExceptionService`
- **Canonical owner:** Collaboration exception policy
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** client action has no presenter
- **Classification:** MISSING_FEATURE
- **Fix scope:** capability-driven confirmation/action
- **Backend change required:** NO
- **Stitch required:** UNKNOWN
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** NO

### COL-G0-009

- **Surface:** Fulfillment issue report
- **Actor(s):** CREATOR
- **Observed behavior:** Disabled one-option field always submits
  `FULFILLMENT_NOT_AS_EXPECTED`.
- **Expected canonical behavior:** Explicit issue input compatible with the
  canonical free-string issue code/description contract.
- **Exact frontend component/file:** `execution/FulfillmentPanel.tsx:63-67,120-125`
- **Current frontend state/data source:** hardcoded local constant
- **Frontend API/client path:** `fulfillment/report-issue`
- **Backend endpoint/service/authority:** canonical schema accepts bounded
  `issueCode` plus description; legacy logistics has a separate enum
- **Canonical owner:** Collaboration Fulfillment
- **Legacy/compatibility dependency:** dual canonical/legacy taxonomy
- **Root cause or investigation hypothesis:** frontend appears shaped by a
  placeholder/legacy taxonomy
- **Classification:** LEGACY_CONTRACT_LEAKAGE
- **Fix scope:** reconcile issue-code UX with canonical command
- **Backend change required:** UNKNOWN
- **Stitch required:** UNKNOWN
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-010

- **Surface:** Counterpart context
- **Actor(s):** BOTH
- **Observed behavior:** Drawers show limited detail projection and explicitly
  state that canonical endpoints/history are unavailable.
- **Expected canonical behavior:** Brand-scoped Creator profile/history and a
  lighter Brand/Campaign/Product/Brief context, with isolated loading/error.
- **Exact frontend component/file:** `context/CreatorContextDrawer.tsx:3-5`;
  `context/BrandContextDrawer.tsx:3-5`
- **Current frontend state/data source:** selected Collaboration detail
- **Frontend API/client path:** none
- **Backend endpoint/service/authority:** required counterpart-context reads do
  not exist
- **Canonical owner:** Collaboration context read + profile/privacy owners
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** confirmed missing read boundary
- **Classification:** MISSING_FEATURE
- **Fix scope:** scoped backend reads and frontend loading/error/presentation
- **Backend change required:** YES
- **Stitch required:** UNKNOWN
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-011

- **Surface:** Counterpart drawer copy
- **Actor(s):** BOTH
- **Observed behavior:** Users see “endpoint is available” and “requires a
  dedicated canonical endpoint.”
- **Expected canonical behavior:** Product-facing empty/unavailable language.
- **Exact frontend component/file:** both context drawers, lines 3-5
- **Current frontend state/data source:** hardcoded copy
- **Frontend API/client path:** none
- **Backend endpoint/service/authority:** none
- **Canonical owner:** approved UI copy
- **Legacy/compatibility dependency:** development placeholder
- **Root cause or investigation hypothesis:** confirmed technical copy
- **Classification:** DEBUG_ACCEPTANCE_UI
- **Fix scope:** remove technical implementation language
- **Backend change required:** NO
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** NO

### COL-G0-012

- **Surface:** Creator bank details
- **Actor(s):** CREATOR
- **Observed behavior:** Creator Payouts imports a Collaboration client mutation
  posting to `/collaboration/creator/bank-details`.
- **Expected canonical behavior:** Settings/Payout owns bank truth;
  Collaboration consumes prerequisite state or links to Settings.
- **Exact frontend component/file:** `api/collaboration-client.ts:44-54`;
  `src/features/creator-payouts/components/CreatorBankDetailsDrawer.tsx:5,34-45`
- **Current frontend state/data source:** Collaboration endpoint
- **Frontend API/client path:** `POST /creator/bank-details`
- **Backend endpoint/service/authority:** both Collaboration and Creator
  Settings write the same bank table
- **Canonical owner:** Creator Settings/Payout
- **Legacy/compatibility dependency:** old Collaboration profile endpoint
- **Root cause or investigation hypothesis:** confirmed dual ownership
- **Classification:** LEGACY_CONTRACT_LEAKAGE
- **Fix scope:** Settings/Payout client/endpoint cutover and compatibility plan
- **Backend change required:** YES
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P0
- **G0.2 investigation required:** YES

### COL-G0-013

- **Surface:** Legacy read projection
- **Actor(s):** BOTH
- **Observed behavior:** DTO exposes `projectionSource` and
  `legacyCompatibility`; frontend does not consume or bound either.
- **Expected canonical behavior:** Compatibility remains explicit,
  diagnosable and unable to imply canonical per-Deliverable truth.
- **Exact frontend component/file:** `contracts/collaboration.contracts.ts:15,21,37`
- **Current frontend state/data source:** canonical or legacy mapper
- **Frontend API/client path:** thread list/detail
- **Backend endpoint/service/authority:** dual canonical/legacy query mapper
- **Canonical owner:** Collaboration compatibility boundary
- **Legacy/compatibility dependency:** explicit
- **Root cause or investigation hypothesis:** INVESTIGATION REQUIRED
- **Classification:** LEGACY_CONTRACT_LEAKAGE
- **Fix scope:** define supported legacy presentation/telemetry/failure boundary
- **Backend change required:** UNKNOWN
- **Stitch required:** NO
- **Product decision required:** YES
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-014

- **Surface:** Realtime degraded recovery
- **Actor(s):** BOTH
- **Observed behavior:** Data is retained and a notice appears, but no manual
  refresh/fallback refetch occurs until reconnection.
- **Expected canonical behavior:** HTTP remains usable with a clear recovery
  path and eventual reconciliation.
- **Exact frontend component/file:** `hooks/use-collaboration-realtime.ts:29-35`;
  `CollaborationWorkspace.tsx:49-52,73-76`
- **Current frontend state/data source:** socket status
- **Frontend API/client path:** persisted GETs
- **Backend endpoint/service/authority:** HTTP read model
- **Canonical owner:** realtime hydration policy
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** recovery cadence is not frozen
- **Classification:** MISSING_UX_BEHAVIOR
- **Fix scope:** manual refresh and/or bounded fallback policy
- **Backend change required:** NO
- **Stitch required:** NO
- **Product decision required:** YES
- **Priority:** P2
- **G0.2 investigation required:** YES

### COL-G0-015

- **Surface:** Production environment configuration
- **Actor(s):** BOTH
- **Observed behavior:** Missing production `VITE_API_URL` falls back to
  `http://localhost:3000`.
- **Expected canonical behavior:** Deployment configuration fails clearly
  rather than silently targeting the user’s machine.
- **Exact frontend component/file:** `src/shared/config/env.ts:1-21`
- **Current frontend state/data source:** Vite build environment
- **Frontend API/client path:** all HTTP and sockets
- **Backend endpoint/service/authority:** deployment/SST configuration
- **Canonical owner:** environment configuration
- **Legacy/compatibility dependency:** local fallback
- **Root cause or investigation hypothesis:** confirmed source fallback;
  actual deployment injection not checked
- **Classification:** ENVIRONMENT_DEPENDENCY
- **Fix scope:** deployment config validation
- **Backend change required:** NO
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P0
- **G0.2 investigation required:** YES

### COL-G0-016

- **Surface:** Loading/empty/chat processing
- **Actor(s):** BOTH
- **Observed behavior:** Loading is text-only, empty conversation is blank,
  and chat has no send busy state.
- **Expected canonical behavior:** Distinct loading, ready-empty and processing
  states that preserve usable context.
- **Exact frontend component/file:** `CollaborationWorkspace.tsx:58-69`
- **Current frontend state/data source:** local booleans/draft
- **Frontend API/client path:** list/detail/messages/message POST
- **Backend endpoint/service/authority:** standard read/message endpoints
- **Canonical owner:** frontend state presentation
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** local states not modeled
- **Classification:** MISSING_UX_BEHAVIOR
- **Fix scope:** state model and controls
- **Backend change required:** NO
- **Stitch required:** UNKNOWN
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** NO

### COL-G0-017

- **Surface:** Brand route topology
- **Actor(s):** BRAND
- **Observed behavior:** `/brand/collaboration-page` remains a public Brand
  preview while `/brand/collaborations` is the operational workspace.
- **Expected canonical behavior:** Frozen implementation map says the singular
  Brand page should mount the shared Collaboration workspace.
- **Exact frontend component/file:** `src/routes/app-routes.tsx:69-70`;
  `src/pages/brand/collaboration/brand-collaboration-page.tsx`
- **Current frontend state/data source:** public Brand landing hook
- **Frontend API/client path:** Brand Centre/public Brand APIs
- **Backend endpoint/service/authority:** not Collaboration runtime
- **Canonical owner:** route/product information architecture
- **Legacy/compatibility dependency:** existing public preview route
- **Root cause or investigation hypothesis:** competing intended route uses
- **Classification:** AUTHORITY_CONFLICT
- **Fix scope:** Product identifies intended canonical route and migration
- **Backend change required:** NO
- **Stitch required:** NO
- **Product decision required:** YES
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-018

- **Surface:** Creator mobile navigation
- **Actor(s):** CREATOR
- **Observed behavior:** Desktop sidebar exposes Chat, but Creator bottom
  navigation lacks Collaboration/Chat while Brand bottom navigation includes it.
- **Expected canonical behavior:** Operational Collaboration remains reachable
  in supported mobile navigation.
- **Exact frontend component/file:** `src/layouts/app-shell/sidebar-items.ts:168-176`;
  `src/layouts/app-shell/bottom-nav-items.ts:20-65`
- **Current frontend state/data source:** shell configuration
- **Frontend API/client path:** none
- **Backend endpoint/service/authority:** none
- **Canonical owner:** app-shell navigation
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** INVESTIGATION REQUIRED
- **Classification:** FRONTEND_INTEGRATION_DEFECT
- **Fix scope:** mobile information architecture
- **Backend change required:** NO
- **Stitch required:** UNKNOWN
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** NO

### COL-G0-019

- **Surface:** Collaboration visual system/responsiveness
- **Actor(s):** BOTH
- **Observed behavior:** Feature CSS includes hardcoded colors, microtext,
  custom card/input treatment and a 1024px mobile cutover.
- **Expected canonical behavior:** Aurora tokens/primitives, readable type,
  mobile spacing and an approved breakpoint/composition.
- **Exact frontend component/file:**
  `components/collaboration-workspace.css:29-38,103-169,205-257,343-370,411-421`
- **Current frontend state/data source:** feature CSS
- **Frontend API/client path:** none
- **Backend endpoint/service/authority:** none
- **Canonical owner:** Aurora + approved G2 composition
- **Legacy/compatibility dependency:** clone/Stitch-derived styling
- **Root cause or investigation hypothesis:** static evidence only; viewport
  behavior not run
- **Classification:** VISUAL_DEBT
- **Fix scope:** defer composition decisions to G2 and integration to G4
- **Backend change required:** NO
- **Stitch required:** UNKNOWN
- **Product decision required:** YES
- **Priority:** P2
- **G0.2 investigation required:** NO

### COL-G0-020

- **Surface:** Regression evidence
- **Actor(s):** BOTH
- **Observed behavior:** No Collaboration-focused frontend tests exist.
- **Expected canonical behavior:** Deterministic coverage for role, hydration,
  stale, terminal, degraded and per-Deliverable behavior before freeze.
- **Exact frontend component/file:** `src/features/collaboration/`
- **Current frontend state/data source:** no test harness/fixtures
- **Frontend API/client path:** all
- **Backend endpoint/service/authority:** deterministic read/command fixtures
- **Canonical owner:** frontend validation
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** no frontend automated-test stack
  was introduced in clone
- **Classification:** MISSING_FEATURE
- **Fix scope:** focused test architecture/fixtures
- **Backend change required:** UNKNOWN
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** YES

### COL-G0-021

- **Surface:** Developer-facing implementation guidance
- **Actor(s):** BOTH
- **Observed behavior:** `docs/collaboration/IMPLEMENTATION.md` still describes
  six stages, Feedback Stage 6, legacy logistics/posting and Collaboration bank
  ownership.
- **Expected canonical behavior:** Five execution stages, post-completion
  Feedback and current module ownership.
- **Exact frontend component/file:** `docs/collaboration/IMPLEMENTATION.md`
- **Current frontend state/data source:** historical implementation tracker
- **Frontend API/client path:** historical paths
- **Backend endpoint/service/authority:** current canonical runtime
- **Canonical owner:** frozen contracts
- **Legacy/compatibility dependency:** explicit historical implementation debt
- **Root cause or investigation hypothesis:** stale tracker
- **Classification:** LEGACY_PRESENTATION_DEBT
- **Fix scope:** clearly archive or reconcile documentation in a separately
  authorized task
- **Backend change required:** NO
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P2
- **G0.2 investigation required:** NO

### COL-G0-022

- **Surface:** Settlement execution
- **Actor(s):** BOTH
- **Observed behavior:** UI can present eligible/processing/blocked/settled,
  but accepted backend gateway always returns
  `SETTLEMENT_EXECUTION_OWNER_UNAVAILABLE`.
- **Expected canonical behavior:** Collaboration owns entitlement; Payout/Escrow
  eventually executes and confirms real money movement.
- **Exact frontend component/file:** `publishing/SettlementCard.tsx`
- **Current frontend state/data source:** authoritative settlement projection
- **Frontend API/client path:** detail read only
- **Backend endpoint/service/authority:** deferred settlement gateway
- **Canonical owner:** Payout/Escrow execution
- **Legacy/compatibility dependency:** none
- **Root cause or investigation hypothesis:** explicitly deferred adapter
- **Classification:** DEFERRED_OWNER
- **Fix scope:** external Payout/Escrow integration task
- **Backend change required:** YES
- **Stitch required:** NO
- **Product decision required:** NO
- **Priority:** P1
- **G0.2 investigation required:** NO

## 12. Authority conflict register

| ID | Conflict | Product decision |
|---|---|---|
| COL-G0-007 | history availability vs posting while PAUSED/terminal; Pause semantics deferred | YES |
| COL-G0-017 | singular Brand route canonical rewire vs current public preview intent | YES |
| canonical-doc drift | lower securement/Fulfillment/auto-publish docs vs later overlays | No new semantics; overlays currently control |

## 13. Missing-state register

Material missing or incomplete states:

- role-not-allowed;
- not-found-or-no-access deep link;
- pane-local read error and retry;
- empty conversation;
- chat send processing;
- degraded realtime manual/fallback recovery;
- counterpart context loading/error/empty/history;
- Creator mobile navigation entry;
- legacy compatibility boundary;
- invalid/incomplete read-model response.

## 14. Legacy/compatibility register

1. `LEGACY_COMPATIBILITY` read rows are typed but not bounded in presentation.
2. Collaboration-owned Creator bank endpoint remains actively consumed.
3. Legacy logistics issue enum coexists with canonical free-string issue code.
4. Historical implementation tracker retains six-stage vocabulary.
5. Secondary Brand route may represent older page ownership.
6. Feature CSS retains clone/Stitch-era local visual primitives.

Confirmed absent from active canonical UI:

- fixed 30/70 policy;
- BARTER payment rail;
- industry-driven Fulfillment;
- one global revision count;
- one canonical Collaboration-level live post;
- auto-approval as permission to publish;
- compliance as direct payout release;
- Feedback Stage 6;
- Pause/Resume actions.

## 15. Likely G0.2 investigation clusters

1. **Route/RBAC and no-access**
   - token role → route → workspace actor → backend ownership-as-404.
2. **Application identity and inbox cardinality**
   - Application → `collaborationId` → source context → row presentation.
3. **Read-model integrity**
   - API validation, required booleans, nullable states and compatibility rows.
4. **Publishing applicability**
   - Brief authoring → approval DTO → brand-uce default → snapshot.
5. **Settings/Payout ownership**
   - dual Creator bank endpoints and compatibility cutover.
6. **Messaging policy**
   - completed/terminal/paused history and posting capability.
7. **Context/privacy read model**
   - profile facts, Brand-scoped history and provider/Intelligence boundaries.
8. **Fulfillment issue taxonomy**
   - canonical code/description vs legacy enum vs current hardcode.
9. **Error/recovery matrix**
   - 400/401/403/404/409/5xx, stale and degraded realtime.
10. **Responsive/Aurora**
    - later runtime evidence at 375/767/768/1023/desktop after functional scope.
11. **Deterministic acceptance fixtures**
    - minimum state set for G1/G5 and frontend regression tests.

## 16. Environmental blockers and dependencies

G0 source audit has no runtime blocker.

Before G1/G5 acceptance:

- local isolated PostgreSQL 16;
- approved migrations and deterministic Collaboration fixtures;
- Brand and Creator QA accounts;
- frontend/backend local processes;
- local socket connectivity;
- fake/local provider boundaries only.

External/deferred Product readiness dependencies:

- real settlement payout/refund adapter;
- auto-approval and Feedback reveal schedulers;
- asset provider;
- publishing verification provider;
- counterpart relationship context read model;
- non-India/TDS/FX policy;
- Pause/resume policy.

Production API URL injection must be verified before deployment because the
frontend source otherwise falls back to localhost.

## 17. G0.1 completion assessment

G0.1 is complete as a source-level whole-module reality audit:

- both Brand and Creator routes inspected;
- all five execution stages inspected;
- chat/context/terminal/completion/Feedback inspected;
- state, realtime, refresh and mobile source behavior inspected;
- material UI actions traced to backend authority;
- canonical conflicts and deferred owners separated from frontend defects;
- no runtime code, CSS, Prisma, configuration or Stitch artifact changed.

This document deliberately stops before G0.2. Root-cause clusters require
Product review and explicit authorization.
