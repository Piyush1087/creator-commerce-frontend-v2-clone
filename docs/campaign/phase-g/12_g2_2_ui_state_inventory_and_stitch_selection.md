# G2.2 — Corrected UI state inventory and Stitch selection

## Status

This replaces the former G2.2 inventory. It derives from `11A_campaign_page_authority_reconciliation.md` and corrected G2.1. The former `CP-ST-01` family is rejected as parent evidence because it treats Reporting and setup composition as workspaces.

## State inventory

| Family | Governing truth | Required handling |
|---|---|---|
| Primary read | Authoritative Campaign projection | Loading skeleton, in-place retry/recovery, and primary error preserve navigation/context without cached authority invention. |
| Lifecycle / readiness | Backend lifecycle, readiness, capabilities | Keep separate. Not-ready and post-live readiness loss remove operability without lifecycle demotion. |
| Header / drawers | Authoritative facts, Asset/Brief hierarchy | Compact by default; Product/Brief and Campaign details use drawers/disclosure. |
| Attention Layer | Performance, Budget, Actionables | Available and unavailable are explicit. Zero requires owner-supplied zero. |
| Operational workspace | Discovery, Applicants, Collaborations | Each has loading, empty, populated, unavailable/deferred, local error, and capability-disabled variants as applicable. |
| Selection | URL plus backend projection | Persist/restore valid selection; fall back for missing, invalid, unavailable, `reporting`, or `applications`. |
| Terminal | Canonical or bounded historical projection | Persistent read-only treatment, no operational selector or mutation affordance. |
| Responsive | Same authority at 390px | One active workspace, visible controls, stacked detail and no overflow. |

## Stitch reference set

| ID | Representative state | Reason |
|---|---|---|
| CP-ST-R01 | Operational Campaign — Desktop | New parent: Header, Attention Layer, vertical selector, Discovery active. |
| CP-ST-R02 | Published / Setup Required — Desktop | Readiness/remediation without a Setup workspace. |
| CP-ST-R03 | Applicants Workspace — Desktop | Canonical Application decision queue. |
| CP-ST-R04 | Collaborations Workspace — Desktop | Independent Collaboration reference boundary. |
| CP-ST-R05 | Completed / Archived Read-only — Desktop | Terminal composition. |
| CP-ST-R06 | Campaign Details Drawer — Desktop | View Campaign progressive disclosure. |
| CP-ST-R07 | Product / Campaign Asset Drawer — Desktop | Configuration hierarchy outside the selector. |
| CP-ST-R08 | Operational Campaign — Mobile 390 | Governing responsive composition. |

Ordinary variants—loading, retry, busy/disabled actions, local errors, empty lists, count changes, paused lifecycle, and unavailable Attention data—derive from the governing set. Do not select a Reporting, Setup, or legacy Applications screen, and do not invoke Stitch before G2.3 acceptance and final Product review.
