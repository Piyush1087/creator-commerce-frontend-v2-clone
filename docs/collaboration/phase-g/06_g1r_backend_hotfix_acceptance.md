# Collaboration Phase G — G1R Backend Hotfix Acceptance

**Status:** ACCEPTED WITH DEBT  
**Captured:** 2026-08-14  
**Finding:** COL-G0-005 only  
**Scope:** Acceptance of existing publishingRequired / provisioning correction  
**No frontend runtime changes. No merge. No deploy.**

---

## SHAs

| Field | Value |
|---|---|
| Starting backend SHA | `0385c8a06abed604402621c1a3e94ee1c4e6d0e6` |
| Candidate backend SHA | `efffc2701a61bbd49748a28608d54f927ee44a4e` |
| Final backend SHA | `efffc2701a61bbd49748a28608d54f927ee44a4e` |
| Backend branch | `feature/collab-clone-reconcile-be` |

**Phase-G backend baseline updated:** YES — final SHA above is the Collaboration Phase-G backend baseline for G1A onward.

---

## Canonical authority used

- Frozen BE clone: `13ce652f432560a91dde1f75ca9a21dfa76d054f`
- Frozen `dummy_tcs` Collaboration contracts / provisioning semantics (`b4ae5bd…` Phase G pin)
- G0 artifacts: `00_baseline.md`, `01_g0_reality_audit.md`, `05_g0_3_authority_freeze_g1_plan.md`

---

## Files changed (candidate diff only)

```
src/features/brand-uce/dto/brand-uce-pipeline.dto.ts
src/features/brand-uce/services/brand-uce-pipeline.service.ts
src/features/brand-uce/services/campaign-application.service.ts
```

Stat: 3 files, +9 / −46. No schema/migration/financial/lifecycle/unrelated Campaign changes in the candidate commit.

---

## Diff-scope result

**PASS** — exact expected file set. Not `G1R_NOT_ACCEPTABLE_SCOPE`.

Working tree at acceptance time may contain unrelated local docs noise; that noise is **not** part of the candidate SHA and was not accepted as baseline content.

---

## Behavior verified

| Check | Result | Evidence |
|---|---|---|
| A. Missing applicability does not silent-default true/false | PASS | Pipeline no longer maps Brief deliverables to `publishingRequired: true`; DTO requires array |
| B. Empty applicability rejected | PASS | `@ArrayMinSize(1)` on `deliverable_publishing_applicability` |
| C. Explicit applicability maps 1:1 | PASS | Service maps only `dto.deliverable_publishing_applicability` fields |
| D. Multiple Deliverables preserve per-item values | PASS | Per-item map of `publishing_required` |
| E. Applications approve does not bypass provision | PASS | Auto `pipeline.approveApplicant` removed; returns Application APPROVED only |
| F. Valid pipeline approve still provisions | PASS | `provisionFromApprovedApplication` still called with explicit mapping |
| G. Collaboration runtime not regressed by this diff | PASS | Diff does not touch Collaboration feature module; full suite green |

No new implementation was required; candidate satisfied frozen COL-G0-005 behavior.

---

## Tests / checks run

| Check | Result | Notes |
|---|---|---|
| Prisma validate | PASS | Agent-run |
| Prisma generate | PASS | Agent-run |
| Targeted Brand-UCE approve tests | N/A | No dedicated Brand-UCE approve unit tests exist in repo |
| Provision / publishingRequired contract tests | PASS | `provision-collaboration.schema.test.ts` — 9/9 |
| Collaboration regression suite | PASS | 101/101 (`node -r ts-node/register/transpile-only --test` over collaboration `*.test.ts`) |
| Nest production build | PASS | Developer-run `npm run build` — nest build + copy-prompt-assets ok |
| `tsc -p tsconfig.build.json --noEmit` | PASS | Developer-run — clean |
| ESLint on changed files | FAIL (formatting only) | 9 `prettier/prettier` errors; fixable with `--fix` |

---

## Environment blockers

None for acceptance of this hotfix. Prior agent Nest build was interrupted by user; developer re-ran successfully.

---

## Compatibility debt

1. **Prettier/eslint formatting** on the three touched brand-uce files (mostly pre-existing style outside the hotfix hunks). Not a behavioral defect. Do **not** expand G1R into a format-only rewrite unless Product authorizes; may be cleaned in a later scoped chore.
2. No dedicated Brand-UCE HTTP/integration test for approve mapping — covered indirectly by provision schema tests + source inspection. Optional G1 follow-up debt, not blocking hotfix acceptance.
3. Collaboration bank dual-write and other G0 findings remain outside G1R.

---

## Merge / deployment status

| Field | Value |
|---|---|
| Merge status | Not merged |
| Deployment status | Not deployed |
| Remotes | Candidate already on origin + piyush reconcile branch from earlier push |

---

## Final G1R disposition

**ACCEPTED WITH DEBT**

Debt is eslint/prettier formatting noise on the touched files and absence of dedicated Brand-UCE approve automated tests — not a failure of the frozen publishing applicability behavior.

Candidate SHA `efffc2701a61bbd49748a28608d54f927ee44a4e` is the accepted Phase-G backend baseline for G1A onward.
