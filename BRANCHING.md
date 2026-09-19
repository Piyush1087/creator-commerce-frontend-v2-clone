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

## Current deploy / promotion map (keep updated)

Snapshot date: **2026-09-19**. Exact branch names — do not invent aliases.
Authoritative copy: backend `BRANCHING.md`.

### Deploy pair — freeze (canonical **in**, C-06 **out**)

| Repo | Exact branch | `origin` tip (2026-09-19) |
|------|--------------|---------------------------|
| Frontend | `freeze/mvp-canonical-application-v1` | `6ea628b` |
| Backend | `freeze/mvp-canonical-application-v1` | `3b7f63f` |

- **creator-dev:** already this FE+BE freeze pair.
- **creator-prod next:** same freeze pair (paired; not one side alone).
- Freeze already has MVP canonical data; **not** C-06.
- Do **not** merge freeze into `development` / `main` until Parent says so.

### Active side work — `docs/meta-app-review` (push to `origin`, not `development`)

| Repo | Exact branch |
|------|--------------|
| Frontend | `docs/meta-app-review` |
| Backend | `docs/meta-app-review` |

Commit + push these to **`origin`**. Do not merge into `development` on this track. Environment deploys stay on freeze (above).

### C-06 — parked

| Repo | Exact branch | `origin` tip (2026-09-19) |
|------|--------------|---------------------------|
| Frontend | `integration/c06-creator-payouts` | `e9ba66d` |
| Backend | `integration/c06-creator-payouts` | `11ce7f6` |

Gate: product approve → reconcile → then `development` → then prod. Keep out of freeze / meta / creator-dev / creator-prod until then.

---

## Required Checks Before Merge

```bash
npm run build
npm run lint
```
