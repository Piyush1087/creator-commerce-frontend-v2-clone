# G0.1 — Whole Campaign Page reality audit

## Result

**NOT ACCEPTED FOR G0 EXIT — PRODUCT DECISION REQUIRED.** The deployable Campaign Page is still structurally built on the legacy UCE product/pipeline/collaboration model. The canonical Campaign Page authority specifies a Campaign Asset reference model and an Application-to-Collaboration handoff. Reconciliation would require a persisted-data conversion policy that is not frozen.

## Findings

| ID | Surface | Classification | Priority | Proven evidence | Root cause | Owner |
|---|---|---|---|---|---|---|
| CAM-G0-001 | Assets / Add Product | LEGACY_CONTRACT_LEAKAGE | P0 | Frontend consumes product CRUD; backend exposes `GET/POST/PATCH/DELETE /campaigns/:id/products`; Prisma persists mutable `UceCampaignProduct` business fields. Canonical `add_product/domain_contract.yaml` requires read-time Brand Centre references and prohibits Campaign-owned business-data duplication. | Deployable data/API model is legacy UCE product ownership, not CampaignAsset reference ownership. | Campaign + Brand Centre integration |
| CAM-G0-002 | Briefs / Deliverables | RUNTIME_CONTRACT_DEFECT | P0 | `UceCampaignBrief.productId` is optional and `onDelete: SetNull`; canonical hierarchy requires a Brief below a Campaign Asset and requires deliverable-grain authority. | Existing persisted relationship can orphan a Brief and cannot prove canonical parent/readiness semantics. | Campaign backend |
| CAM-G0-003 | Discovery / Applicants / Collaboration | LEGACY_CONTRACT_LEAKAGE | P0 | Frontend has `Prospects`, `Applicants`, and `Active` pipeline tabs. Backend `BrandUcePipelineService` uses `UceCampaignCollaboration` for prospect states and the controller exposes pipeline collaboration workflow commands. Canonical authority makes Discovery pre-application, Applicants the decision aggregate, and Campaign only a Collaboration reference boundary. | Legacy UCE pipeline owns states that canonical authority assigns to independent domains. | Campaign / Applicants / Collaboration |
| CAM-G0-004 | Header / lifecycle / readiness | RUNTIME_CONTRACT_DEFECT | P1 | Current API exposes status patching and UCE status; canonical Page requires lifecycle capability projection, nine hydration outcomes, derived readiness, and post-live readiness loss without lifecycle demotion. | Current read DTO/API was built before canonical Page projection contract. | Campaign backend + frontend |
| CAM-G0-005 | Workspace orchestration | FRONTEND_INTEGRATION_DEFECT | P1 | `CampaignPipelineWorkspace` renders fixed `prospects`, `applicants`, `active`, and `reporting` tabs; canonical visibility/priority must be supplied by authoritative workspace projection and persisted selection. | UI is component/status shaped rather than hydration/workspace-projection shaped. | Campaign frontend |
| CAM-G0-006 | Reporting | LEGACY_CONTRACT_LEAKAGE | P1 | UCE reporting snapshots/refresh endpoint are presented from the Campaign pipeline; canonical reporting must consume supplied Reporting/Performance Intelligence and truthfully represent unavailable/freshness/finality. | Legacy Campaign reporting snapshot remains the consumer contract. | Reporting owner + Campaign consumer |
| CAM-G0-007 | State/error/mobile verification | MISSING_UX_BEHAVIOR | P2 | Source audit found no dedicated Campaign Page test suite in the deployable `main` tree; no G0 source evidence proves all required loading, unavailable, degraded, post-live or mobile states. | The legacy page lacks a canonical state-contract test harness. | Campaign frontend |
| CAM-G0-008 | Create Campaign boundary | DEFERRED_OWNER | P3 | Accepted Create Campaign feature branches are not the deployment baseline. No Campaign Page evidence currently proves a Create Campaign regression. | Out of scope by Phase G instruction. | Create Campaign (deferred) |

## Cross-cutting conclusion

The P0 findings share a migration boundary: existing persisted Campaign products, briefs, and pipeline collaboration rows do not have a frozen mapping into Brand Centre references, Campaign Assets, Application aggregates, and independently owned Collaborations. A source-only rewrite would silently choose a data/backfill and ownership policy.

## Required Product decision

The frozen contracts establish the destination model but do not specify how existing deployable UCE data must be treated. Product must choose the migration policy before G0.2/G1 can safely determine implementation scope.

| Option | Policy | Consequence |
|---|---|---|
| A | Canonical cutover with an explicit backfill/mapping specification for existing UCE product, brief, prospect/applicant, and collaboration data. | Enables a controlled backend-led reconciliation; requires approved mapping, failure handling, and audit/rollback rules. |
| B | Treat legacy UCE Campaign Page records as historical/read-only and require newly canonical Campaign Assets/Applications/Collaborations for all future Campaign Page activity. | Avoids semantic conversion, but requires an approved user-facing legacy/historical boundary and migration communications. |
| C | Retire/delete legacy UCE Campaign Page data after export. | Destructive; requires explicit retention, export, authorization, and rollback policy. |

No option is inferred by the frozen authority. Do not implement migration, backfill, or destructive removal without this decision.

## G0.1 Supervisor normalization

```text
Stage: G0.1
Status: NOT_ACCEPTED
Starting frontend SHA: 7e5750240c554aca6e651c31de371a8bd25ec3dc
Final frontend SHA: 7e5750240c554aca6e651c31de371a8bd25ec3dc
Starting backend SHA: 5bce1f948e23774f16c7f2c65a309cc4e0a7fe71
Final backend SHA: 5bce1f948e23774f16c7f2c65a309cc4e0a7fe71
Findings addressed: whole-surface source audit
Findings remaining: CAM-G0-001 through CAM-G0-007
Product decisions remaining: legacy UCE data migration/cutover policy
Authority conflicts remaining: none; authority defines destination but not data treatment
Tests/checks run: canonical contract search, frontend route/component/client audit, backend controller/service/schema audit
Checks not run: runtime smoke; not required to establish this source-level stop
Environment blockers: none
Debt introduced/retained: legacy UCE Campaign Page model remains in deployable main
Unexpected backend requirement: a data-model and API reconciliation is required
Unexpected frontend requirement: workspace/capability projection consumer is required
Migration blocker: YES — persisted legacy data policy is not approved
Next-stage recommendation: PRODUCT_DECISION_REQUIRED
```
