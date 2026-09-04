# Branching Strategy

This repo uses two long-lived branches:

- `main` - deployment-ready baseline.
- `development` - integration branch for active work before it is promoted to
  `main`.

Use the exact spelling `development`.

## Rules

- New work branches should branch from `development`.
- Merge completed feature work back into `development` first.
- Promote `development` to `main` only after review and verification.
- Do not deploy from both old and v2 repos to the same SST stage at the same
  time.
- Keep `RUNBOOK.md` updated when temporary work is added or removed.

## Suggested Flow

```bash
git checkout development
git pull
git checkout -b feature/<short-task-name>
```

After review:

```bash
git checkout development
git merge feature/<short-task-name>
```

When ready to promote:

```bash
git checkout main
git merge development
```

## In-flight (not yet in `development`)

Hold these until review closes / PR merges. Do **not** base new module work on them
unless the handoff explicitly depends on them.

| Work | Branch (BE + FE) | Status (2026-09-04) |
|------|------------------|---------------------|
| C-01 / C-05 Creator Entry + Settings | `feature/c01-c05-creator-integration` | Under Piyush review (pass-2). **Not** merged to `origin/development`. Resume here for follow-up fixes only. |

Pass-2 tip SHAs (clone review):  
BE `d8a3f23cfac6288b745823b60d8c0e38e3ba8b90` · FE `11cb12b635806983d2f2b2d8ca4b8b3b61da1f43`

---

## Required Checks Before Merge

```bash
npm run build
npm run lint
```
