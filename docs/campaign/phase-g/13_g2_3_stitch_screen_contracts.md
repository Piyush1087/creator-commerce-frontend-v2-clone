# G2.3 — Corrected Stitch screen contracts

## Status

This replaces the former G2.3 set. It is a bounded design brief derived from corrected G2.1/G2.2 and does not itself authorize Stitch invocation. All screens preserve canonical Asset, Brief, Application, and independent Collaboration ownership.

## Shared rules

- Header precedes Attention Layer; Attention precedes the three-workspace selector and active workspace.
- Reporting is a Performance card with an optional `View Full Report` trigger, never a selector item.
- Setup/configuration is Header summary, drawer, or readiness remediation, never a selector item.
- Lifecycle, readiness, and capability remain distinct; backend truth governs actions and operability.
- Truthful unavailable copy is required for unavailable provider or projection data.

## Contracts

### CP-ST-R01 — Operational Campaign, Desktop

Live/ready parent state: Campaign Header, Product/Brief summary, Attention Layer, vertical selector, and Discovery selected. Use only authoritative examples for lifecycle, compact facts, Performance, Budget, and actionables. Discovery may be unavailable; do not turn that into an empty list.

### CP-ST-R02 — Published / Setup Required, Desktop

Not-ready/reconciliation-required state. Place readiness/remediation below the Header and use a configuration drawer or staged remediation for the exact Campaign Asset and canonical Brief context. Operational workspaces may not appear usable until capability permits. No Setup tab.

### CP-ST-R03 — Applicants Workspace, Desktop

Applicants selected. Prioritize submitted canonical Applications, creator and Brief context, clear accept/decline hierarchy, progress/error, history disclosure, and independent Collaboration references. Acceptance must not imply Collaboration creation.

### CP-ST-R04 — Collaborations Workspace, Desktop

Collaborations selected. Show independent reference rows/cards, creator context, and safe navigation when supplied. Campaign is not the lifecycle owner.

### CP-ST-R05 — Completed / Archived Read-only, Desktop

Terminal Campaign with persistent read-only treatment and safe historical facts. Remove operational actions and selection; do not invent readiness, metrics, reconstruction, or lineage.

### CP-ST-R06 — Campaign Details Drawer, Desktop

`View Campaign` reveals progressive Campaign context: objective, timing, authoritative facts, summary availability, and safe deeper detail. It is not a hidden workspace.

### CP-ST-R07 — Product / Campaign Asset Drawer, Desktop

Expand the Header's Product/Campaign Asset and Brief hierarchy with explicit ownership. Never infer an Asset, invent a Brief, or expose migration vocabulary.

### CP-ST-R08 — Operational Campaign, Mobile 390

Apply R01 at 390px: compact AppShell; identity/lifecycle/primary action; readiness; Attention Layer; compact three-workspace selector; one active workspace. Drawers/disclosure replace horizontal density; controls, retry, and selection remain reachable without clipping.

## Handoff boundary

After Product acceptance, the next eligible action is a separate Stitch worker package using these eight contracts and the approved design-system/AppShell authority. No frontend/backend implementation, provider call, or Stitch execution is authorized by this document alone.
