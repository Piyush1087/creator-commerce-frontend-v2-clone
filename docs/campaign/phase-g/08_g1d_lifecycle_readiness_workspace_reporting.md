# G1D — Lifecycle, readiness, workspace, and Reporting acceptance

## Supervisor decision

```text
G1D ACCEPTED WITH DEBT
```

Backend Campaign shell now authoritatively supplies lifecycle capabilities, canonical readiness, workspace projection, and a truthful Reporting-unavailable state. The Campaign Page consumes those backend fields; lifecycle toggle availability no longer derives from status in the frontend.

Readiness consumes active canonical Assets, canonical Briefs, and campaign budget. It does not use legacy Product/Brief/pipeline counts. A Campaign that is already ACTIVE remains ACTIVE if it later loses readiness; readiness instead disables activation/resume capability and reports missing requirements.

Workspace projection historically supplied Discovery, Applications, Collaborations, and Reporting visibility, priority, availability, counts, and unavailable copy. Reporting was unavailable rather than fabricated or sourced from legacy UCE snapshots.

## G-R2 reconciliation amendment — Campaign Page read/projection contract

`11A_campaign_page_authority_reconciliation.md` is the controlling reconciliation authority for this amendment. This section supersedes the historical Campaign Page workspace and Reporting assertions above; all other accepted G1D lifecycle, readiness, canonical Asset/Brief, and legacy-write-cutoff evidence remains preserved.

The authoritative Campaign Page projection is conceptually:

```text
CampaignPageProjection
├── campaign (identity, lifecycle, capabilities, core facts)
├── campaignSummary
├── productsBriefsSummary
├── attention (performance, budget, actionables)
└── workspaces (discovery, applicants, collaborations)
```

The canonical workspace set contains exactly three operational identities: **Discovery**, **Applicants**, and **Collaborations**. `Applications` is superseded as a Campaign Page workspace label. Reporting and Setup are not workspaces: Reporting belongs to the Campaign Attention Layer, while Product/Campaign Asset and Brief composition belongs to Campaign configuration exposed through the Header and its drawers.

Projection obligations are bounded as follows:

- workspace operability is readiness/capability-aware; a not-ready Campaign must not present an operational workspace as usable;
- Product/Campaign Asset and Brief retain their existing canonical hierarchy;
- Campaign Header/read-drawer facts, Campaign Summary, and performance are exposed only when authoritative, otherwise through truthful unavailable states;
- Budget exposes total, authoritative committed creator compensation, and remaining only when that commitment authority is available; no remaining value is guessed;
- Actionables are a deterministic/Intelligence projection, not a new task aggregate; and
- this read-model amendment does not prescribe Prisma persistence changes.

Historical `?workspace=reporting` is a superseded URL value. Selection mechanics are retained, but the amended frontend/backend contract must deterministically fall back to a valid canonical workspace for absent, invalid, unavailable, or superseded selections.

## Evidence

| Check | Result |
|---|---|
| G1A/G1B/G1C backend regressions | PASS — 5/5, 6/6, 5/5 |
| Backend typecheck/build | PASS |
| Frontend typecheck/scoped lint | PASS |
| Frontend production build | PASS via short workspace mapping; existing chunk-size warning only |
| Prisma validate/generate | PASS; `127.0.0.1:5432/creator_shop_acceptance` verified |
| Migration applied / DB mutated | NO |

## Retained debt

- G1D focused deterministic backend/frontend coverage remains to be added/executed before consolidated G1 acceptance.
- Migrated-schema runtime acceptance remains deferred; no Phase G migration was applied to the frozen local acceptance database.
- Frontend Vitest retains the managed Windows path-normalization runner issue.
- `DEPLOYED_DATA_EVIDENCE_REQUIRED` remains open.

No merge, deployment, provider call, or Stitch invocation occurred. G1E was not generated or executed.

## Immutable checkpoints

```text
Frontend G1D checkpoint: 2a73e18c27d3850dcb398df8fbea9cbc34ae6a17
Backend G1D checkpoint: 18acfee37d1d3797a60d25bec2896b2ffc10d055
```
