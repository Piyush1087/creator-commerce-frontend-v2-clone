# G0.3 — Authority freeze and G1 decomposition

## G0 completion

G0 is complete. The destination authority, deployed legacy root causes, local acceptance classification, and Product migration policy are frozen. No deployed population count is inferred from local evidence.

## Campaign Page authority matrix

| Surface | Authority | Required implementation direction |
|---|---|---|
| Asset | Campaign Asset referencing explicitly selected Brand Centre entity | remove new legacy Product writes; present reconciliation-required state where mapping is absent |
| Brief | Brief belongs to Campaign Asset, with deterministic deliverable semantics | never infer ownership or deliverables from a legacy row |
| Discovery | supplied acquisition/recommendation domain | remove legacy UCE prospect authority from the new operational path |
| Applicants | Application decision aggregate | no Collaboration-backed applicant authority |
| Collaboration | independent Collaboration owner | Campaign presents reference only |
| Lifecycle/readiness/workspaces | backend projection/capabilities | no frontend status-derived workspace authority |
| Reporting | Reporting/Performance provider | truthful supplied/unavailable state only |

## Finding dispositions

| Finding | Disposition |
|---|---|
| CAM-G0-001 | G1_IMPLEMENT |
| CAM-G0-002 | G1_IMPLEMENT |
| CAM-G0-003 | G1_IMPLEMENT |
| CAM-G0-004 | G1_IMPLEMENT |
| CAM-G0-005 | G1_IMPLEMENT |
| CAM-G0-006 | G1_IMPLEMENT |
| CAM-G0-007 | G1_IMPLEMENT |
| CAM-G0-008 | DEFERRED_OWNER |

## Compatibility and migration policy

- New Page writes use canonical authority only.
- Historical/terminal legacy-only records remain bounded read-only compatibility.
- Active legacy-only Campaigns require explicit selection of the correct BrandProfile, Offering, or BrandOffer and display reconciliation-required copy; no technical terminology is shown to the Brand.
- A legacy Brief is migrated only after Asset ownership and semantics are deterministic.
- Application/Collaboration lineage is never recreated to make the migration appear complete.
- `DEPLOYED_DATA_EVIDENCE_REQUIRED` remains debt, not an authority conflict.

## G1 package order

1. **G1A — Canonical Campaign Asset and reconciliation foundation.** Backend read/write contract and frontend reconciliation-required state; no destructive migration.
2. **G1B — Canonical Brief and deliverable boundary.** Dependent on G1A Asset identity.
3. **G1C — Discovery, Applicants, and Collaboration ownership cutover.** Dependent on canonical Page projection.
4. **G1D — Lifecycle/readiness/workspace/reporting projection.** Consolidate supplied capabilities and truthful states.
5. **G1E — state completeness, compatibility read-only presentation, and regression coverage.**
6. **Consolidated G1 functional acceptance.**

## G1A acceptance gate

- no new legacy Product write from the Campaign Page path;
- explicit Brand Centre selection is required for active legacy Campaign reconciliation;
- no inferred identity/backfill;
- terminal compatibility remains non-authoritative/read-only;
- typecheck, focused tests, build, and relevant backend regression evidence are recorded.

## Deferred owners

| Capability | Owner | Current Campaign treatment |
|---|---|---|
| Deployed data population | deployment data owner | `DEPLOYED_DATA_EVIDENCE_REQUIRED` |
| Create Campaign | previously accepted module | integration boundary only |
| Reporting Intelligence | Reporting owner | supplied/unavailable projection only |

## G2 entry criteria

All G1 packages and consolidated functional acceptance accepted; no unresolved ownership conflict; reconciliation-required semantics implemented and verified. Stitch remains prohibited.
