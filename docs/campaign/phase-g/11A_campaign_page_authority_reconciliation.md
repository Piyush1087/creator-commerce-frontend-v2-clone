# Campaign Page Authority Reconciliation

Status: CANONICAL PRODUCT / UX RECONCILIATION AUTHORITY
Phase: G-R1 / bounded G1D-G1E + G2 reconciliation
Actor: BRAND
Implementation changes authorized by this artifact: NO
Stitch invocation authorized by this artifact alone: NO

## 1. Purpose

This artifact freezes the corrected Campaign Page product model after Product review identified that accepted G1/G2 Campaign Page composition had preserved an obsolete workspace model.

It is intentionally a reconciliation authority, not an implementation patch. It exists so subsequent G1D/G1E amendments, G2 replacement artifacts, frontend/backend changes, and Stitch work are driven by one explicit Product source rather than by reconstructing decisions from conversation history.

The governing Brand mental model is:

> **Understand the Campaign → understand performance / what needs attention → work in the relevant operational workspace.**

This artifact supersedes any prior Phase G assumption that Reporting or Setup is a Campaign workspace.

## 2. Authority decision

```text
Decision: G1_CONTRACT_AMENDMENT_REQUIRED
Scope: BOUNDED
Reopen G1A: NO
Reopen G1B: NO
Reopen G1C: NO
Amend G1D: YES
Amend G1E acceptance scope: YES
Replace G2.1: YES
Replace G2.2: YES
Replace G2.3: YES
Restart Phase G: NO
```

Canonical Asset, Brief, Application, Discovery ownership, lifecycle/readiness separation, Share, retry/recovery, and independent Collaboration ownership remain preserved unless a later implementation reconciliation exposes a concrete contradiction.

## 3. Canonical Campaign Page information architecture

The Campaign Page contains exactly three conceptual layers.

```text
CAMPAIGN PAGE
│
├── 1. CAMPAIGN HEADER
│   ├── Campaign identity + lifecycle
│   ├── AI Campaign summary when authoritative
│   ├── View / Edit / Share / lifecycle control
│   ├── 3–4 high-value Campaign facts
│   └── Product → Brief summary / hierarchy
│
├── 2. CAMPAIGN ATTENTION LAYER
│   ├── Performance
│   ├── Budget
│   └── Actionables
│
└── 3. OPERATIONAL WORKSPACE
    ├── Discovery
    ├── Applicants
    └── Collaborations
```

The conceptual questions are therefore:

1. **What is this Campaign?** — Header.
2. **How is it doing / what needs attention?** — Performance, Budget, Actionables.
3. **Where do I do the work?** — Discovery, Applicants, Collaborations.

## 4. Canonical workspace contract

There are exactly three Campaign workspace identities:

```text
DISCOVERY
APPLICANTS
COLLABORATIONS
```

### 4.1 Reporting is not a workspace

`REPORTING` must not appear in the canonical Campaign workspace list, workspace enum, workspace selector, workspace count, workspace priority ordering, or Stitch workspace navigation.

Reporting is Campaign-level performance intelligence shown in the Campaign Attention Layer. A detailed Reporting experience may be opened from `View Full Report`, but Reporting is not Campaign workspace navigation.

Historical `?workspace=reporting` is treated as an invalid/superseded URL value and must deterministically fall back to a valid canonical workspace according to the amended backend/frontend selection contract.

### 4.2 Setup is not a workspace

Product / Campaign Asset setup, Brief setup, readiness remediation, and related configuration are Campaign configuration concerns. They must not become a fourth `SETUP` workspace.

Their placement is primarily:

- Product / Brief summary inside the Header;
- expanded Product → Brief hierarchy on demand;
- readiness/setup callout when action is required;
- Product/Asset and Brief drawers/flows when the Brand acts.

### 4.3 Desktop workspace composition

Desktop should use a compact left-side vertical workspace selector with one active workspace rendered to its right.

```text
┌──────────────────────┬──────────────────────────────────────┐
│ Discovery            │                                      │
│                      │                                      │
│ Applicants        4  │          ACTIVE WORKSPACE            │
│                      │                                      │
│ Collaborations    2  │                                      │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

This is a workspace selector, not a second AppShell sidebar. It should remain visually subordinate to the active workspace content.

## 5. Campaign Header contract

The Header is the persistent Campaign identity / control surface.

### 5.1 Required content

The Header should support:

- Campaign name;
- lifecycle/status;
- AI Campaign summary when authoritative;
- `View`;
- `Edit` when backend capability permits;
- `Share` when backend capability permits;
- lifecycle/on-off control when backend capability permits;
- approximately 3–4 core Campaign facts;
- collapsed Product / Brief summary with expandable Product → Brief hierarchy.

### 5.2 Core Campaign facts

The exact visual arrangement is a G2 design concern, but facts should prioritize high-value Campaign understanding rather than engineering fields. Candidate facts include:

- objective;
- audience;
- publishing schedule / dates;
- commercial offer or another high-value commercial fact.

Do not create a dense permanent strategy dashboard inside the Header.

### 5.3 AI Campaign summary ownership

The AI Campaign summary is Intelligence-owned generated output.

Campaign Page may consume an authoritative summary projection but must not create a client-side pseudo-AI summary from Campaign fields and label it AI.

Until the owner/provider contract exists:

```text
campaignSummary.status = UNAVAILABLE
```

The UI may omit the summary or show a neutral unavailable treatment. It must not fabricate copy.

### 5.4 Product / Brief summary

Default collapsed representation should communicate scale without consuming the page, for example:

```text
2 Products • 3 Briefs active
```

Expanded hierarchy should preserve canonical Campaign Asset → Brief ownership:

```text
Product / Campaign Asset A
├── Brief A1
└── Brief A2
    + Add Brief

Product / Campaign Asset B
└── Brief B1

+ Add Product
```

The UI may use Brand-friendly `Product` language where appropriate, while implementation authority continues to use the canonical Campaign Asset model.

No Brief may visually or functionally exist without its owning Campaign Asset.

## 6. View Campaign behavior

`View` opens a read-only right-side Campaign Details drawer on desktop.

Its information hierarchy mirrors Create Campaign conceptually:

```text
Campaign Strategy
Creator Strategy
Commercial Strategy
```

Rules:

- read-only;
- no duplicated editable form state;
- no new Campaign aggregate;
- source values come from canonical Campaign read authority;
- terminal Campaigns remain inspectable;
- mobile may adapt the drawer to a full-height sheet/full-screen composition.

`Edit` remains a separate capability/action and must not be conflated with `View`.

## 7. Campaign Attention Layer

The Attention Layer sits between Header and Workspaces and contains:

```text
Performance
Budget
Actionables
```

This layer exists to answer the Brand question: **how is this Campaign doing and what requires attention now?**

It is not workspace navigation.

## 8. Performance / Reporting contract

### 8.1 Ownership

Reporting calculation remains Intelligence-owned.

Campaign Page owns only Campaign-facing availability/projection behavior and a route/action to the future full Reporting experience.

Legacy reporting snapshots must not become authoritative merely because they exist in historical runtime structures.

### 8.2 Unavailable state

When authoritative Reporting is unavailable:

- show truthful unavailable/coming-later treatment;
- do not show zero metrics;
- do not imply `0 impressions`, `0 reach`, `0 engagement`, etc.;
- `View Full Report` should be hidden or disabled according to the final capability contract.

Example semantic treatment:

```text
Campaign Performance
Performance insights will appear once authoritative Campaign reporting is available.
```

### 8.3 Available state

When a valid Reporting calculation exists, the Campaign Page may render one Reporting card containing:

- primary KPI;
- supporting KPIs appropriate to the Campaign objective;
- freshness/finality where required by the frozen Reporting contract;
- `View Full Report` action.

Numbers used in Stitch are illustrative visual fixtures only and must never become backend truth.

### 8.4 Full report

`View Full Report` opens the Reporting view/experience.

The full Reporting UI is explicitly outside the Campaign Page reconciliation scope. Campaign Page work only defines the trigger and the summary card behavior.

## 9. Budget contract

### 9.1 Canonical definition

For MVP, Campaign Budget Remaining means **uncommitted Campaign budget**, not unpaid cash balance.

```text
Campaign Budget Remaining
=
Total Campaign Budget
−
Committed Creator Compensation
```

`Committed Creator Compensation` means the agreed creator compensation associated with formed/accepted Campaign-linked Collaborations according to the authoritative Collaboration commercial contract.

Pending Applications, Discovery creator estimates, and unaccepted commercial proposals do not consume Campaign budget.

### 9.2 Example

```text
Total Campaign Budget        100,000
Creator A committed           20,000
Creator B committed           15,000
Pending applicant proposal    10,000   ← not committed
Discovery estimate             8,000   ← not committed

Committed Budget              35,000
Remaining Budget              65,000
Remaining %                       65%
```

### 9.3 Ownership boundary

Campaign owns `totalCampaignBudget`.

Collaboration owns the authoritative agreed creator commercial commitment.

Campaign Page may calculate/project:

```text
budget.total
budget.committed
budget.remaining
budget.remainingPercent
```

Campaign must not introduce a second mutable persisted `remainingBudget` value merely for the page.

If authoritative Collaboration commercial commitments are not yet available:

```text
budget.total = AVAILABLE
budget.committed = UNAVAILABLE
budget.remaining = UNAVAILABLE
budget.remainingPercent = UNAVAILABLE
```

The UI must not substitute `100% remaining` as a guess.

## 10. Actionables contract

Actionables are a Campaign Page projection, not a new persisted Campaign aggregate for MVP.

Conceptually:

```text
Campaign state
+ readiness
+ capability state
+ workspace counts/status
+ Reporting state when authoritative
→ CampaignActionable[]
```

Suggested projection shape:

```text
id
type
priority
title
description?
ctaLabel
ctaTarget
source
```

where:

```text
source = SYSTEM | INTELLIGENCE
```

### 10.1 Deterministic SYSTEM examples

- no Campaign Asset → `Add a Product`;
- Campaign Asset exists but no published Brief → `Create a Brief`;
- pending Applications exist → `Review Applicants`;
- reconciliation required → corresponding remediation action;
- recoverable workspace error → retry/recovery action where appropriate.

### 10.2 Intelligence actionables

Future Intelligence may provide Campaign-specific performance/recommendation actionables. They must be marked/treated as Intelligence-owned input rather than recreated by frontend heuristics.

### 10.3 Visibility

Show approximately the top 3–4 actionables on the Campaign Page. The page must not become a generic task manager.

## 11. Activation / readiness behavior

Lifecycle, readiness, and capability remain distinct concepts.

```text
Lifecycle ≠ readiness ≠ capability
```

Canonical execution readiness continues to require the frozen canonical setup condition, including at least:

```text
≥ 1 ACTIVE Campaign Asset
+
≥ 1 PUBLISHED Brief under an active Campaign Asset
```

### 11.1 Before execution readiness

Do not present operational workspaces as if they are usable.

The Campaign Page may preserve structural orientation by showing the workspace selector in a locked/unavailable treatment, provided that:

- no operational action appears enabled;
- backend capability remains authoritative;
- setup/readiness remediation is visibly prioritized;
- empty/unavailable must not be confused with an operational zero state.

Conceptually:

```text
Header
↓
Setup/readiness callout
↓
Product / Brief configuration
↓
Operational Workspaces
  Discovery       locked/unavailable
  Applicants      locked/unavailable
  Collaborations  locked/unavailable
```

### 11.2 After execution readiness

Relevant operational workspace capabilities activate according to backend/domain availability.

Readiness loss after LIVE must not automatically demote lifecycle unless the frozen lifecycle service contract explicitly requires it. Existing G1 separation remains preserved.

## 12. Discovery contract preservation

Discovery remains a separate recommendation/provider projection.

This reconciliation does not change Discovery ownership or authorize fabricated creator recommendations.

States remain semantically distinct:

- loading;
- unavailable/deferred owner;
- empty, only if authoritative provider explicitly says empty;
- populated;
- recoverable error/retry.

Unavailable must never be rendered as `0 creators`.

## 13. Applicants contract preservation

Applicants workspace remains the Brand decision surface over canonical Application aggregates.

It may contain:

- pending Applications requiring decision;
- resolved Applications progressively disclosed;
- Applicant Intelligence when authoritative;
- creator / Campaign Asset / Brief context required for a decision;
- independent Collaboration reference when one exists.

Accepting an Application must not make Campaign the owner of Collaboration.

## 14. Collaboration boundary preservation

Collaborations is a Campaign workspace only in the sense that the Campaign Page maps/references independent Collaboration entities associated with this Campaign.

Campaign does not own:

- Collaboration lifecycle;
- deliverable execution;
- product dispatch;
- content approval;
- creator payment;
- posting completion;
- Collaboration-specific persistence/state transitions.

The Campaign workspace may open/navigate to the independent Collaboration module when routing is supplied.

## 15. URL-backed workspace selection

The accepted URL-backed selection/re-entry behavior from G1E remains desirable, with the corrected canonical workspace set.

Valid values are only:

```text
discovery
applicants
collaborations
```

Rules:

- valid selected workspace may persist in URL state;
- valid selection restores on re-entry;
- invalid/superseded value falls back deterministically;
- unavailable/locked selection cannot become operational merely because it is present in the URL;
- fallback uses backend/canonical priority/availability, not arbitrary frontend ordering.

`reporting` is now an explicitly invalid historical value.

## 16. Mobile authority

Mobile must preserve the same Product authority and tasks rather than inventing a separate Campaign Page model.

Required principles:

- Campaign identity/status/control remains accessible;
- secondary Header actions may move to overflow where necessary;
- Product/Brief hierarchy becomes stacked/disclosed;
- Attention Layer stacks vertically;
- exactly one active workspace is shown at a time;
- workspace selector may adapt to a compact mobile selector without changing workspace identities;
- decision tables must become mobile-safe cards/rows rather than requiring desktop horizontal overflow;
- right drawers may become full-height sheets/full-screen panels;
- no page-level horizontal overflow.

One representative 390px Stitch state is sufficient initially; other mobile functional variants should derive from the same responsive grammar unless implementation exposes a design-distinct collision.

## 17. State truth rules

The Campaign Page must preserve the following distinctions:

```text
EMPTY ≠ UNAVAILABLE ≠ ERROR ≠ LOADING
```

Examples:

- no Applications and Applications available → EMPTY;
- Discovery provider not integrated → UNAVAILABLE;
- Reporting provider not available → UNAVAILABLE;
- authoritative read failed → ERROR with Retry when recoverable;
- request in progress → LOADING.

Do not fabricate cached authority or convert missing provider truth into zeros.

## 18. G1 amendment scope

### 18.1 G1A / G1B / G1C

No reopening required.

Preserve:

- explicit Campaign Asset ownership;
- Brief/Deliverable ownership under Campaign Asset;
- Discovery separation;
- canonical Application aggregate;
- independent Collaboration boundary.

### 18.2 G1D — amend

G1D Campaign Page read/projection authority must be amended to support conceptually:

```text
CampaignPageProjection
│
├── campaign
│   ├── identity
│   ├── lifecycle
│   ├── capabilities
│   └── coreFacts
│
├── campaignSummary
│
├── productsBriefsSummary
│
├── attention
│   ├── performance
│   ├── budget
│   └── actionables
│
└── workspaces
    ├── discovery
    ├── applicants
    └── collaborations
```

Specific correction:

- remove Reporting from workspace projection;
- make workspace operability readiness/capability aware;
- preserve Product/Brief canonical hierarchy;
- expose only authoritative/unavailable performance state;
- expose enough Campaign facts for Header/read drawer;
- support truthful Budget projection availability;
- support deterministic Actionables projection.

This artifact does **not** prescribe new Prisma persistence merely to satisfy the read model.

### 18.3 G1E — amend acceptance scope

Existing G1E acceptance evidence remains valid for preserved behaviors such as:

- primary read retry/recovery;
- selected workspace persistence/restoration mechanics;
- canonical Campaign Asset/Brief authority;
- lifecycle/readiness distinction;
- responsive/mobile interaction principles.

The following historical acceptance is superseded:

```text
Reporting workspace exists and is unavailable.
```

New acceptance must prove instead:

- Reporting is absent from canonical workspaces;
- Reporting availability is represented in Campaign Performance;
- `?workspace=reporting` falls back as an invalid historical value;
- not-ready Campaign does not expose operational workspace capability;
- ready Campaign activates applicable workspaces;
- Reporting availability does not alter workspace identity count;
- Collaboration remains independently owned/referenced.

## 19. G2 supersession scope

The existing G2.1, G2.2, and G2.3 artifacts are superseded where they depend on the obsolete workspace / Reporting placement model.

### 19.1 G2.1 must be replaced

Correct authority must reflect:

- three operational workspaces only;
- Reporting in Attention Layer;
- Header Product/Brief hierarchy;
- vertical desktop workspace selector;
- Campaign View drawer;
- Budget and Actionables;
- activation-aware workspace presentation.

### 19.2 G2.2 must be replaced

State inventory and Stitch-selection logic must be rebuilt from the corrected IA rather than retaining Reporting-workspace or Setup-workspace design families.

### 19.3 G2.3 must be replaced

Old Stitch screen contracts based on Reporting as a workspace and horizontal/old workspace grammar are not valid final Product authority.

Do not incrementally patch CP-ST-01 and treat it as the parent.

## 20. Stitch consequence

Existing CP-ST-01 is rejected as parent evidence for the corrected Campaign Page.

Recommended bounded Stitch reference set:

```text
CP-ST-R01  Operational Campaign — Desktop          ← NEW PARENT
CP-ST-R02  Published / Setup Required — Desktop
CP-ST-R03  Applicants Workspace — Desktop
CP-ST-R04  Collaborations Workspace — Desktop
CP-ST-R05  Completed / Archived Read-only — Desktop
CP-ST-R06  Campaign Details Drawer — Desktop
CP-ST-R07  Product / Campaign Asset Drawer — Desktop
CP-ST-R08  Operational Campaign — Mobile 390
```

### 20.1 New parent state

CP-ST-R01 should be information-rich and mature, for example:

```text
LIVE
2 Products
3 active Briefs
Reporting result available
Budget projection available
3–4 actionables
Discovery selected
```

This state should establish the core visual grammar for most subsequent variants.

### 20.2 Derived without dedicated Stitch screens

Codex/frontend should derive ordinary functional variants from governing visual references, including:

- loading;
- local error/retry;
- button busy;
- disabled capability;
- different counts;
- LIVE ↔ PAUSED;
- different Campaign names/content;
- zero/one/many applicants;
- Reporting unavailable;
- AI summary unavailable;
- Budget remaining unavailable;
- standard workspace empty states.

Stitch should be reserved for design-distinct composition, not every backend state.

## 21. Functional impact classification

### 21.1 Preserve / already supported conceptually

- Campaign lifecycle;
- readiness distinction;
- canonical Campaign Asset hierarchy;
- canonical Brief hierarchy;
- Applicants;
- independent Collaboration reference boundary;
- Share command/behavior;
- URL-backed workspace selection mechanics;
- primary read retry;
- responsive AppShell authority.

### 21.2 Documentation / frontend composition correction

- vertical workspace selector;
- Header composition;
- Product/Brief collapse/expand;
- Campaign View drawer composition;
- Attention Layer layout;
- responsive composition.

### 21.3 Backend/read-projection amendment required later

- remove Reporting from workspace projection;
- activation-aware workspace capability/availability;
- Header fact projection where missing;
- Campaign Summary availability/projection;
- Performance summary availability/projection;
- Budget total/committed/remaining availability projection;
- deterministic Actionables projection.

### 21.4 Deferred-owner implementation

- actual KPI/Reporting calculation;
- AI Campaign summary generation;
- Intelligence-generated performance recommendations;
- full Reporting UI;
- Collaboration workflow;
- provider-specific Discovery recommendation generation.

## 22. Explicit non-goals

This reconciliation does not authorize:

- backend or frontend implementation changes yet;
- Prisma migration/schema change merely for page composition;
- reopening Create Campaign;
- reopening Campaign Asset/Brief ownership;
- moving Collaboration into Campaign ownership;
- implementing full Reporting UI;
- inventing Reporting metrics;
- inventing AI summary content;
- inventing AI actionables;
- invoking Stitch before amended G1/G2 authority is written and accepted.

## 23. Bounded continuation plan

```text
G-R1  Freeze Campaign Page Authority Reconciliation   ← THIS ARTIFACT
  ↓
G-R2  Amend G1D Campaign Page read/projection contract
  ↓
G-R3  Amend/revalidate affected G1E acceptance scope
  ↓
G-R4  Replace G2.1 IA / authority matrix
  ↓
G-R5  Replace G2.2 state inventory + Stitch selection
  ↓
G-R6  Replace G2.3 Stitch screen contracts
  ↓
G-R7  Regenerate Stitch worker package
  ↓
Final Product review
  ↓
Stitch invocation
```

No frontend/backend implementation should be changed during G-R1.

## 24. Freeze statement

The following Product authority is frozen for the bounded reconciliation:

> **The Brand Campaign Page is composed of a Campaign Header, a Campaign Attention Layer, and exactly three operational workspaces: Discovery, Applicants, and Collaborations. Reporting is not a workspace; it is Intelligence-owned Campaign performance presented through a summary card and `View Full Report` trigger. Product/Campaign Asset and Brief setup are Campaign configuration, not workspace identities, and the Header owns their collapsed/expanded hierarchy. Campaign Budget Remaining means total Campaign budget minus authoritative committed creator compensation from formed Campaign-linked Collaborations; if that commitment authority is unavailable, remaining budget is unavailable rather than guessed. Campaign actionables are a thin deterministic/Intelligence projection, not a new task aggregate. Lifecycle, readiness, and capability remain distinct, and operational workspaces must not appear usable before backend execution-readiness/capability permits them. Existing canonical Asset, Brief, Application, Discovery, and independent Collaboration ownership remain unchanged.**

```text
G-R1 STATUS: FROZEN
NEXT ELIGIBLE ACTION: G-R2 — AMEND G1D CAMPAIGN PAGE READ / PROJECTION CONTRACT
IMPLEMENTATION CHANGED: NO
STITCH INVOKED: NO
```