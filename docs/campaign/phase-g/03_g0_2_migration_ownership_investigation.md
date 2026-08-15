# G0.2 — Migration and ownership investigation

## Result

**ACCEPTED WITH PRODUCT DECISION.** The Product-approved active-legacy cutover policy resolves the local `D. ACTIVE_MIGRATION_BLOCKER`: the Campaign remains visible in a reconciliation-required state, permits only safe actions, and requires explicit selection of the correct BrandProfile, Offering, or BrandOffer before further execution. No mapping is inferred and no local data was mutated.

## Source-proven inventory

| Legacy entity | Current authority/use | Canonical destination | New-write status |
|---|---|---|---|
| `UceCampaignProduct` | Mutable Campaign-owned product fields and CRUD | Campaign Asset referencing Brand Centre entity | Must be replaced; legacy endpoint is not a new-write path after cutover |
| `UceCampaignBrief` | Optional `productId`, `SetNull` parent deletion behavior | Brief under required Campaign Asset, with Deliverables | Must be replaced; no inferred parent backfill |
| `UceCampaignCollaboration` pipeline | Holds prospects, applicants, active collaboration workflow and commands | Discovery → Application → independent Collaboration | Must not remain operational Campaign authority |

`BrandOffer` and independent `Collaboration` models exist in the backend schema, but no source-visible linkage establishes a deterministic mapping from a legacy UCE product/brief/pipeline row to them. No Campaign-specific compatibility projection was found; the only Campaign UI compatibility evidence is mock ID mapping and a user-visible legacy-brief fallback.

## Proven legacy writes and reads

- Writes: product CRUD, brief CRUD, prospect creation/invite, and pipeline collaboration commands under `/api/v1/brand-uce/campaigns/:campaignId/...`.
- Reads: products, briefs, pipeline prospects/applicants/active collaborations, and reporting; the frontend fixed-tab `CampaignPipelineWorkspace` consumes those legacy reads.

## Local acceptance classification

| Population | Classification | Evidence |
|---|---|---|
| Legacy Campaigns | 7 total: 5 DRAFT, 1 LIVE, 1 ARCHIVED | source population |
| Legacy Products | 4 active: 2 DRAFT-parent, 1 LIVE-parent, 1 ARCHIVED-parent | one LIVE-parent record is `D` |
| Legacy Briefs | 3 active: 1 DRAFT-parent, 1 LIVE-parent, 1 ARCHIVED-parent; one has no Product parent | LIVE-parent record is `D`; unparented record cannot be deterministically reconstructed |
| Legacy pipeline rows | 2, both ARCHIVED-parent: 1 `APPLICANT_REJECTED`, 1 `ACTIVE_WORKFLOW` | no active Campaign pipeline blocker |
| Independent Collaborations | 1, linked to legacy pipeline, canonical Asset, canonical Brief, and Application fields | `A. CANONICAL_ALREADY_EXISTS` compatibility projection evidence |
| Brand Offers | 0 | no BrandOffer linkage exists in this dataset; this does not establish absence of an Offering or other permitted Brand Centre entity |
| Campaign Assets / Applications | tables absent | no canonical counterpart population exists in this acceptance dataset |
| LIVE Product + Brief | 1 Product + 1 Brief, both active; no Brand Offer/Campaign Asset linkage | `D. ACTIVE_MIGRATION_BLOCKER` |
| ARCHIVED Product + Brief + pipeline rows | 1 Product, 1 Brief, 2 pipeline rows | `C. HISTORICAL_READ_ONLY` pending presentation design; no inferred reconstruction |
| DRAFT-parent Product/Brief records | 2 Products, 1 Brief | neither `A` nor `B` can be established; normal canonical creation may proceed only under an explicit new-write flow, not a backfill |

## Deployed-data classification status

`DEPLOYED_DATA_EVIDENCE_REQUIRED`. The local acceptance dataset is not evidence of staging/development/production population. No deployed count or record classification is inferred here.

## Smallest unblocking evidence

Resolved by Product on 2026-08-15: active legacy-only Campaigns require manual reconciliation to an explicitly selected Brand Centre entity before further operational execution. Terminal legacy Campaigns remain bounded read-only compatibility. Deployed-data evidence remains separately required but does not block source reconciliation.

## Supervisor normalization

```text
Stage: G0.2 migration/ownership investigation
Status: ACCEPTED_WITH_DEBT
Starting frontend SHA: 7e5750240c554aca6e651c31de371a8bd25ec3dc
Final frontend SHA: 7e5750240c554aca6e651c31de371a8bd25ec3dc
Starting backend SHA: 5bce1f948e23774f16c7f2c65a309cc4e0a7fe71
Final backend SHA: 5bce1f948e23774f16c7f2c65a309cc4e0a7fe71
Findings addressed: source ownership and legacy read/write inventory
Findings remaining: implementation of the approved reconciliation-required state
Product decisions remaining: none
Authority conflicts remaining: none
Checks run: schema, controller, service, client, compatibility search, safety-gate verification, and read-only local population/linkage queries
Checks not run: deployed population queries (intentionally out of scope)
Environment blockers: DEPLOYED_DATA_EVIDENCE_REQUIRED, non-blocking for this local classification
Debt retained: legacy UCE records remain authoritative in deployed main pending cutover
Migration blocker: active LIVE Campaign class cannot be deterministically reconstructed
Next-stage recommendation: ADVANCE_AUTONOMOUSLY to G0.3
```
