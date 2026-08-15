# G2.1 — Campaign workspace UX / IA authority matrix

## Scope and governing principle

This is Product/UX analysis over the accepted G1 checkpoints: frontend `e00f383b4bfb1181a42d31f16e26ce23e5797006` and backend `0f2c6c7b659d7305d36bd2ee0775973494d5a95e`. It does not change domain ownership, Create Campaign, source, or provider semantics.

The Brand mental model is: **understand the Campaign, see what needs attention, then work in the relevant workspace**. Canonical ownership details remain truthful but should not dominate the page hierarchy.

## Surface authority matrix

| Surface | Purpose / primary question | Data authority | Primary / secondary actions | Information hierarchy and pattern | Required states / capability rule | Deferred implications / mobile behavior |
|---|---|---|---|---|---|---|
| A. Campaign header | Identify the Campaign and answer “what state is it in, and what can I do now?” | Campaign shell lifecycle, capabilities, essentials | Primary: backend-permitted lifecycle action. Secondary: edit essentials, share/router where already accepted | Persistent compact header: name and lifecycle first; objective/date/budget summary second; edit/share progressively disclosed | Loaded, lifecycle variants, action-in-progress/error, terminal. Visibility/enabled state follows backend capabilities, never frontend status inference | Do not imply readiness equals lifecycle. Mobile keeps name/status/action accessible; secondary actions enter overflow/menu |
| B. Details / strategy summary | Answer “what are we trying to achieve?” without occupying the whole workspace | Campaign shell essentials/strategy projection | Primary: none in viewing mode. Secondary: accepted edit entry point | Collapsed summary with objective, timing, audience, channels, commercial envelope; details on demand | Populated/partial; terminal read-only. Edit only when backend capability permits | Avoid permanent multi-card expansion. Mobile uses disclosure rather than horizontal grids |
| C. Readiness / reconciliation | Answer “can this Campaign proceed, and exactly what blocks it?” | Backend readiness, reconciliation, capabilities | Primary: resolve the highest-priority actionable requirement. Secondary: navigate to Assets/Briefs | Prominent conditional callout below header; readiness summary first, missing requirements second, remediation CTA third | Ready, not-ready, reconciliation-required, post-live readiness loss, terminal. Backend decides requirements and action eligibility | Never demote lifecycle visually when readiness is lost. Mobile callout remains near top and action remains full-width/useful |
| D. Campaign Assets | Answer “what Brand Centre thing is this Campaign promoting?” | Campaign Asset referencing explicitly selected BrandProfile/Offering/BrandOffer | Primary: explicitly link an Asset when permitted. Secondary: inspect linked Asset | Summary within Setup; linked Asset identity first, selector only in remediation/edit disclosure | Absent, present, reconciliation-required, loading/error choices, terminal read-only. `can_select_campaign_asset` governs selection | Never auto-select or expose migration vocabulary. Mobile selector and confirmation stack vertically |
| E. Briefs / deliverables | Answer “what must creators make for each Asset?” | Canonical Brief and deliverables owned by explicit Campaign Asset | Primary: create Brief when permitted. Secondary: inspect/update accepted semantics | Brief summary/list first; creation as contextual panel/drawer; Asset ownership explicit at form start | Empty, populated, create unavailable, form error, terminal read-only. Backend capability governs creation | Never suggest a Brief without Asset ownership. Mobile form is staged/stacked; deliverables remain scannable |
| F. Discovery workspace | Answer “where can I find relevant creators before they apply?” | Separate Discovery/recommendation provider projection | Primary only when authoritative supply exists; otherwise none | Dedicated workspace; truthful unavailable/empty callout instead of fabricated list | Loading, unavailable/deferred, empty, populated only when supplied, error/retry | Do not equate unavailable with zero creators. Mobile derives from workspace navigation; no separate imaginary experience |
| G. Applicants workspace | Answer “who applied, and what decision is required?” | Canonical Application aggregate | Primary: accept/decline submitted Application. Secondary: inspect Brief/creator context and existing Collaboration reference | Decision queue: submitted items first, resolved items progressively disclosed | Loading, empty, populated, command progress/error, statuses; capability/aggregate state controls actions | Campaign does not own Collaboration creation. Mobile uses single-column decision cards and clear action separation |
| H. Collaborations workspace | Answer “which independent Collaborations relate to this Campaign?” | Independent Collaboration reference carried by canonical Application/projection | Primary: open referenced Collaboration if/when routing is supplied. Secondary: none | Reference list, not lifecycle controls; creator and reference status first | Loading, empty, populated, unavailable/error if supplied projection fails | Never recreate or control Collaboration lifecycle here. Mobile uses compact reference rows/cards |
| I. Reporting workspace | Answer “is authoritative performance available?” | Separate Reporting/Performance provider | Primary only when authoritative provider exists | Workspace placeholder with explicit availability/freshness truth; no zero-value metric dashboard | Currently unavailable/deferred; populated only after owner contract; error distinct from unavailable | No legacy snapshots, metrics, freshness, or finality. Responsive placeholder derives from desktop |
| J. Lifecycle controls | Answer “which lifecycle transition is safe now?” | Backend lifecycle capabilities | Primary: permitted transition. Secondary: contextual explanation when unavailable | One clear status/control cluster in header; no duplicate status toggles elsewhere | DRAFT/PUBLISHED where supplied, LIVE/ACTIVE, PAUSED, COMPLETED, ARCHIVED; busy/error. Backend capability decides visibility/enabled state | Readiness is adjacent context, not the control source. Mobile preserves a single operable control |
| K. Empty states | Explain absence and next truthful step | Owning domain per workspace | Primary only when an accepted action can resolve emptiness | Inline workspace empty state with short explanation and contextual CTA | No Assets, Briefs, Applications, Collaborations; Discovery empty only if provider distinguishes it | Do not use “0” for unavailable. Mobile retains same hierarchy with reduced decoration |
| L. Loading states | Preserve orientation while authoritative reads resolve | API/read state | None | Shell skeleton for primary read; localized skeleton/progress for workspace reads | Primary loading, workspace loading, command progress | No new design semantics; existing Aurora loading patterns; mobile skeleton follows final layout |
| M. Unavailable/degraded | Explain a dependency cannot currently supply truth | Owning provider plus backend projection | Retry only for recoverable error, not deferred ownership | Contextual callout within the affected workspace; shell remains usable | Discovery unavailable, Reporting unavailable, no workspace available, dependency degraded | Do not imply zero data or operational availability. Mobile copy and status remain visible without overflow |
| N. Error/retry | Help recover without losing Campaign context | Failed authoritative request | Primary: Retry. Secondary: back to Campaigns for primary failure | Primary read error replaces page body but preserves navigation; local workspace/command errors stay inline | Primary error, workspace error, mutation error, retry/recovery | Do not fabricate cached authority. Mobile CTA remains reachable and clearly labelled |
| O. Terminal/historical | Let the Brand understand history without suggesting execution | Canonical record where present; bounded compatibility projection otherwise | Primary: none operational. Secondary: inspect historical facts, return to Campaigns | Explicit read-only banner; stable summary and historical sections; operational controls absent | COMPLETED/ARCHIVED terminal canonical and historical compatibility | Never expose technical legacy terms or canonical readiness. Mobile is a read-only single-column record |
| P. Mobile behavior | Preserve the same authority and tasks in constrained space | Same backend/API authorities | Same permitted primary action; AppShell navigation remains available | Header compresses; readiness follows; workspace selector becomes horizontally scrollable or compact switcher; one active workspace at a time; disclosures stack | All operational/setup/terminal/error families as responsive variants; one explicit mobile representative required | No desktop table dependency, clipped controls, or page-level horizontal overflow; secondary utilities move to menu/drawer |

## Campaign Page information architecture

### Permanent shell

- Campaign identity, lifecycle status, backend-permitted primary lifecycle action.
- Compact objective/timing/budget context.
- Conditional readiness/reconciliation callout.
- Workspace navigation with backend order, availability, and counts.

### Summarized or progressively disclosed

- Strategy, targeting, commercial details, and logistics.
- Campaign Assets and Brief inventory after setup is complete.
- Resolved Applications and verbose deliverable detail.
- Edit and share utilities.

### Workspace-owned content

- Setup: Asset identity, Briefs, deliverables, and remediation.
- Discovery: pre-application acquisition/recommendations.
- Applicants: Application decisions.
- Collaborations: references to the independent domain.
- Reporting: authoritative availability/performance only.

### Action prominence

- Persistent: only the backend-permitted lifecycle action and the single highest-priority readiness remediation.
- Contextual: link Asset, create Brief, accept/decline Application, retry a failed workspace, inspect a Collaboration reference.
- Never implied: Discovery recommendations or Reporting metrics when their providers are unavailable; Collaboration lifecycle control; historical execution.

## G2 UX findings

| ID | Finding | Risk | Design direction (not implementation) |
|---|---|---|---|
| CAM-G2-UX-001 | The accepted page is a long sequence of cards: strategy, legacy-compatible repository, canonical Briefs, Assets, then readiness/workspaces. | Brand must understand engineering composition before finding the current task. | Create a stable shell and move setup content into a task-oriented Setup area; keep one active work surface |
| CAM-G2-UX-002 | Assets appear after Brief creation UI even though explicit Asset ownership is prerequisite. | The visual sequence contradicts the dependency. | In Setup, show Asset identity/remediation before Briefs and deliverables |
| CAM-G2-UX-003 | Lifecycle status and readiness occupy separate components but lack a deliberately explained relationship. | Brand may interpret “setup needed” as lifecycle demotion or assume LIVE means ready. | Pair them in the shell with distinct labels: lifecycle describes operation; readiness describes requirements |
| CAM-G2-UX-004 | Workspace identifiers are rendered as lower-case domain IDs with counts. | The interface exposes API vocabulary rather than Brand tasks. | Use Brand labels and concise purpose copy while preserving backend IDs/order internally |
| CAM-G2-UX-005 | Applications and Collaboration references share one data-loading component. | Brand may mistake accepting an Application for starting/owning a Collaboration. | Give Applicants decision composition and Collaborations reference composition visibly separate goals |
| CAM-G2-UX-006 | “Recommendations unavailable” and Reporting unavailable can visually resemble empty workspaces. | Brand may read unavailable as zero creators or zero performance. | Give provider-unavailable a distinct status treatment and explanatory copy, never empty-list metrics |
| CAM-G2-UX-007 | Historical compatibility lacks a design-distinct page hierarchy. | A visible historical record may look executable. | Use a persistent read-only banner and remove all operational controls |
| CAM-G2-UX-008 | Strategy and repository information is permanently expanded before the active workspace. | Primary task and decision queue fall below the fold, especially on mobile. | Summarize core facts and progressively disclose detail |
| CAM-G2-UX-009 | Primary page errors are factual but visually disconnected from the Campaign shell. | Recovery feels like a dead end. | Preserve Campaign navigation context and present Retry as the dominant recovery action |

## G2.1 conclusion

No new Product semantics are required. The accepted authority is sufficient to design the Campaign Page as a stable shell, conditional Setup/readiness flow, and backend-ordered task workspaces.

