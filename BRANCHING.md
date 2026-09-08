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

## Canonical freeze branch (do not merge into `development` until Parent says so)

| Work | Branch (BE + FE) | Status |
|------|------------------|--------|
| MVP Canonical Application Freeze V1 | `freeze/mvp-canonical-application-v1` | Active. Branched from `origin/development` after C-03 merge. Leave `development` untouched. |

Registers: `docs/ai-collaboration/mvp-canonical-freeze/`.

---

## Required Checks Before Merge

```bash
npm run build
npm run lint
```
