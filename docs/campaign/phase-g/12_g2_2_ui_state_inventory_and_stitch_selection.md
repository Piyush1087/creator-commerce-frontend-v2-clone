# G2.2 — UI state inventory, collapse, and Stitch selection

## Complete functional state inventory

Thirty-one accepted functional states were identified. They are not a Cartesian product; impossible, unsupported, or visually identical combinations are excluded.

| Dimension | Accepted states represented |
|---|---|
| Primary page | loading; loaded; read error with Retry |
| Lifecycle | DRAFT/pre-launch; LIVE/ACTIVE; PAUSED; COMPLETED; ARCHIVED |
| Readiness | ready; not ready; reconciliation required; readiness lost after LIVE without lifecycle demotion |
| Assets | absent; present; explicit selection in progress/error |
| Briefs | absent; present; create/update in progress/error |
| Discovery | unavailable/deferred; empty only if authoritatively supplied; populated only if authoritatively supplied; read error |
| Applications | loading; empty; submitted decision queue; resolved; decision in progress/error |
| Collaborations | loading; empty; referenced independent Collaborations; read error |
| Reporting | unavailable/deferred; populated only if a future authoritative provider exists |
| Compatibility | canonical operational; terminal canonical; terminal historical read-only |
| Viewport | desktop; mobile functional composition |

## Design-distinct families and classification

| Family ID | Family | Included functional states | Classification | Rationale |
|---|---|---|---|---|
| DF-01 | Operational Campaign shell | LIVE/ACTIVE or PAUSED, ready or readiness-lost, normal workspace navigation | STITCH_REQUIRED | Establishes the permanent hierarchy and interaction grammar governing most variants |
| DF-02 | Setup / reconciliation | DRAFT/not-ready, Asset absent, explicit Asset selection, Brief absent/create | STITCH_REQUIRED | Dominant goal and remediation flow replace normal operational focus |
| DF-03 | Applicants decision workspace | Submitted Applications, resolved Applications, decision progress/error | STITCH_REQUIRED | Decision queue, evidence, and paired accept/decline actions need dedicated interaction authority |
| DF-04 | Collaborations reference workspace | Empty or populated independent references | STITCH_REQUIRED | Must visually separate post-acceptance references from Application decisions and avoid lifecycle ownership |
| DF-05 | Terminal / historical read-only | COMPLETED/ARCHIVED canonical and bounded historical compatibility | STITCH_REQUIRED | Read-only hierarchy and absence of operational controls are materially distinct |
| DF-06 | Primary read error / recovery | Campaign read failure and Retry/recovery | CODE_ONLY_VARIANT | Accepted semantics derive from the CP-ST-01 shell plus Aurora Alert/Button patterns; no separate visual authority is required |
| DF-07 | Mobile operational Campaign | 390×844 shell, readiness, workspace switcher, lifecycle action, AppShell navigation | STITCH_REQUIRED | Constrained navigation/action composition needs one explicit responsive authority |
| DF-08 | Lifecycle/status variants | DRAFT/PUBLISHED where supplied, LIVE, PAUSED; enabled/disabled/busy lifecycle action | CODE_ONLY_VARIANT | Same shell composition; backend data/capability changes badge and action variant |
| DF-09 | Readiness variants | ready, not-ready, post-live readiness loss | CODE_ONLY_VARIANT | Same shell/callout placement with different requirements and permitted CTA |
| DF-10 | Empty collection variants | no Briefs, no Applications, no Collaborations | CODE_ONLY_VARIANT | Same workspace composition with contextual copy/CTA |
| DF-11 | Populated/zero-count variants | different Campaign names, counts, one or many records, resolved Application statuses | CODE_ONLY_VARIANT | Data and item variants do not change hierarchy |
| DF-12 | Local loading/command states | workspace loading, selection/create/decision progress | NO_DESIGN_REQUIRED | Existing Aurora progress/skeleton/disabled-control patterns are sufficient |
| DF-13 | Local error/retry states | Asset-choice, Brief command, Application decision, workspace read errors | CODE_ONLY_VARIANT | Inline Alert + contextual Retry/error treatment derives from the governing workspace |
| DF-14 | Primary loading | Campaign shell loading | NO_DESIGN_REQUIRED | Existing design-system skeleton/progress pattern; no new interaction model |
| DF-15 | Discovery unavailable | No authoritative recommendation provider | DEFERRED_OWNER | Campaign must show truthfully unavailable and must not design imaginary recommendations |
| DF-16 | Reporting unavailable | No authoritative Reporting/Performance provider | DEFERRED_OWNER | Campaign must show truthfully unavailable and no metrics/freshness/finality |
| DF-17 | Future supplied Discovery/Reporting | Populated provider-owned experience | DEFERRED_OWNER | Composition cannot be frozen until the authoritative owner contract exists |

Counts by classification: **STITCH_REQUIRED 6; CODE_ONLY_VARIANT 6; NO_DESIGN_REQUIRED 2; DEFERRED_OWNER 3.**

## Stitch state candidates

| State ID | State Family | Representative Scenario | Dominant User Goal | Classification | Why Design-Distinct? | Desktop/Mobile | Stitch Priority |
|---|---|---|---|---|---|---|---|
| CP-ST-01 | Operational Campaign | LIVE, ready Campaign on Discovery workspace with unavailable provider truth | Understand Campaign health and move to the next workspace/task | STITCH_REQUIRED | Defines shell, hierarchy, readiness/lifecycle distinction, workspace navigation, and progressive disclosure | Desktop | P0 |
| CP-ST-02 | Setup and reconciliation | Active/Draft Campaign requiring explicit Brand Centre Asset, then Brief setup | Resolve the next safe setup requirement | STITCH_REQUIRED | Remediation flow and primary CTA replace normal workspace operation | Desktop | P0 |
| CP-ST-03 | Applicants decision queue | Ready Campaign with one submitted canonical Application | Review and decide an Application without implying Collaboration creation | STITCH_REQUIRED | Evidence hierarchy and decision actions are unique | Desktop | P0 |
| CP-ST-04 | Collaboration references | Campaign with one existing independent Collaboration reference | Understand which ongoing Collaboration relates to the Campaign | STITCH_REQUIRED | Reference-only composition must be visibly different from Application decisions and lifecycle management | Desktop | P1 |
| CP-ST-05 | Terminal historical Campaign | ARCHIVED historical/read-only Campaign with incomplete canonical reconstruction | Understand what happened without attempting execution | STITCH_REQUIRED | Persistent read-only framing and removed operational affordances materially change the page | Desktop | P0 |
| CP-ST-07 | Mobile operational Campaign | LIVE/ready Campaign at 390×844 with workspace change and lifecycle control | Operate the Campaign without clipped navigation/actions | STITCH_REQUIRED | Compact shell, workspace navigation, action priority, disclosures, and AppShell coexist differently | Mobile | P0 |

Six screens are sufficient. Separate screens are not requested for primary read error/retry, counts, Campaign names, PAUSED versus LIVE, empty versus one-item lists, action busy states, or unavailable provider data.

## Variant coverage map

### CP-ST-01 — Operational Campaign

Covers DF-06 primary read error/retry using preserved Campaign/navigation context and Aurora Alert/Button patterns; DF-08 lifecycle variants; DF-09 ready/not-ready/post-live readiness-loss copy; empty and populated Discovery/Application/Collaboration counts; strategy disclosure; local loading/error variants; PAUSED and LIVE action-capability changes; truthful unavailable Discovery and Reporting callouts.

### CP-ST-02 — Setup and reconciliation

Covers no Asset; explicit BrandProfile/Offering/BrandOffer choice without inference; reconciliation-required copy; Asset-choice loading/error; linked Asset with no Brief; Brief create form, progress/error; multiple Assets requiring explicit Brief ownership; Draft/pre-launch setup.

### CP-ST-03 — Applicants decision queue

Covers no Applications; one/many submitted Applications; accepted/rejected resolved items; decision progress/error; optional existing Collaboration reference; capability-disabled decision action.

### CP-ST-04 — Collaboration references

Covers no linked Collaborations; one/many independent references; reference read error; creator identity variants. It does not cover Collaboration lifecycle controls.

### CP-ST-05 — Terminal historical Campaign

Covers COMPLETED and ARCHIVED canonical Campaigns; terminal legacy-only compatibility; canonical-wins presentation; partial historical facts; absence of operational execution, Asset, Brief, Application, Collaboration, and lifecycle actions.

### CP-ST-07 — Mobile operational Campaign

Covers responsive CP-ST-01, workspace change and URL restoration, invalid/unavailable workspace fallback, readiness callout, lifecycle action, Reporting unavailable, strategy disclosure, bottom/AppShell navigation, and no blocking horizontal overflow. Setup, terminal, and error screens derive responsively unless later evidence shows a material composition conflict.

## Mobile strategy

Only CP-ST-07 requires separate mobile Stitch authority. The normal operational page has the densest collision of shell, lifecycle action, readiness, workspace navigation, content, and AppShell navigation. Once that grammar is frozen, Setup, Applicants, Collaborations, terminal, and error states can use the same responsive rules plus their desktop composition. A mobile version of every state would duplicate authority without changing hierarchy.

## Product semantics gate

No `PRODUCT_DECISION_REQUIRED` state was found. Discovery and Reporting populated experiences remain `DEFERRED_OWNER`; their absence is not a missing Campaign Page semantic. G2 must not design provider-owned functionality before those contracts exist.

## Supervisor output

```text
G2.1 STATUS: COMPLETE
G2.2 STATUS: COMPLETE
TOTAL FUNCTIONAL STATES IDENTIFIED: 31
DESIGN-DISTINCT FAMILIES: 17
STITCH_REQUIRED: 6
CODE_ONLY_VARIANT: 6
NO_DESIGN_REQUIRED: 2
DEFERRED_OWNER: 3
PRODUCT DECISIONS REQUIRED: NONE
RECOMMENDED NEXT STEP: Product-approved amended set CP-ST-01, CP-ST-02, CP-ST-03, CP-ST-04, CP-ST-05, and CP-ST-07 may advance to G2.3 contract generation.
```

No Stitch call, screen generation, frontend/backend implementation, merge, deployment, or G2.3 work was performed.
