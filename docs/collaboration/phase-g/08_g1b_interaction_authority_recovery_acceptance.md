# Collaboration Phase G — G1B Interaction Authority, Recovery & Creator Cancellation

**Status:** ACCEPTED WITH DEBT  
**Captured:** 2026-08-15  
**Package:** G1B only — no G1C, no Stitch, no merge, no deploy  
**Commit/push:** committed and pushed to GitHub (`origin` + `piyush`)

---

## SHAs

| Field | Value |
|---|---|
| Starting frontend SHA | `eafa4c071ae0da49739b7f531f59e536978dae42` |
| Starting backend SHA | `efffc2701a61bbd49748a28608d54f927ee44a4e` |
| Final frontend SHA | `7c994deeb16e78eae400914811364e5ee8fa4fb6` |
| Final backend SHA | `c6e10aca0734587d9f637dbf42d59bdabe2a5671` |

**Phase-G frontend baseline updated:** YES  
**Phase-G backend baseline updated:** YES

---

## Findings closed

| ID | Result |
|---|---|
| COL-G0-006 | Pane-local error ownership (`INBOX_READ` / `DETAIL_READ` / `MESSAGES_READ` / `MESSAGE_SEND` / `EXECUTION_COMMAND` / `CONTRACT_READ` + session/unavailable/degraded surfaces); retry on inbox/detail; send failure preserves draft |
| COL-G0-007 | BE projects `PostCollaborationMessage` only when effective lifecycle is ACTIVE; POST enforces same via `commandConflict(INVALID_STATE)`; FE composer gates on `message` capability only; CompletedPanel no longer claims chat remains available |
| COL-G0-008 | Creator `CreatorCancellationCard` when `CancelCollaborationByCreator` capability present; Brand never gets Creator cancel presenter; confirm → busy → refetch; action-level error on failure |
| COL-G0-014 | Manual **Refresh** when realtime degraded (desktop panes + mobile bar); reconnect still calls authoritative `refreshAll`; no polling |
| COL-G0-016 | Inbox loading/empty/failed; chat loading/empty (“No messages yet”)/send busy/send failed/read-only composer |

---

## Frontend files changed

- `docs/collaboration/phase-g/07_g1a_foundation_access_read_integrity_acceptance.md` (traceability only; disposition unchanged)
- `src/features/collaboration/components/CollaborationWorkspace.tsx`
- `src/features/collaboration/components/CollaborationExecutionHub.tsx`
- `src/features/collaboration/components/collaboration-workspace.css`
- `src/features/collaboration/components/execution/CompletedPanel.tsx`
- `src/features/collaboration/components/execution/CreatorCancellationCard.tsx` (new)
- `src/features/collaboration/utils/collaboration-composer-state.ts` (new)
- `src/features/collaboration/utils/collaboration-error-surface.ts` (new)
- `src/features/collaboration/utils/collaboration-g1b-interaction.test.ts` (new)
- `docs/collaboration/phase-g/08_g1b_interaction_authority_recovery_acceptance.md` (this file)

## Backend files changed

- `src/features/collaboration/utils/collaboration-thread.mapper.ts`
- `src/features/collaboration/services/collaboration.service.ts`
- `src/features/collaboration/services/collaboration-messaging-lifecycle.test.ts` (new)

Unrelated working-tree docs moves/deletes under `docs/collaboration/product-docs/Codex_handoff/` were **not** part of G1B implementation scope and must not be mixed into the G1B commit.

---

## Tests added

### Frontend tests

- Added: 7 (`collaboration-g1b-interaction.test.ts`)
- Full Vitest suite: **25/25 PASS**

Coverage: composer capability authority (no lifecycle re-implementation), pane-local errors, 404/401 classification, Creator cancel capability gate, Brand end ≠ cancel, realtime degraded surface name.

### Backend targeted tests

- Added: 4 (`collaboration-messaging-lifecycle.test.ts`)
- ACTIVE projects message action; PAUSED/COMPLETED/CANCELLED/TERMINATED do not; ACTIVE POST succeeds; non-ACTIVE POST rejected with `INVALID_STATE`; terminal history read remains available

### Backend Collaboration regression

- **105/105 PASS** (`node -r ts-node/register/transpile-only --test` over `src/features/collaboration/**/*.test.ts`)

---

## Validation

| Check | Result |
|---|---|
| Frontend typecheck | PASS — `npm run typecheck` |
| Backend typecheck | PASS — `npx tsc -p tsconfig.build.json --noEmit` |
| Frontend lint | PASS — scoped eslint on G1B FE paths |
| Backend lint | PASS — scoped eslint on G1B BE paths |
| Frontend production build | PASS — `npm run build` |
| Backend production build | PASS — `npm run build` |
| Prisma validate | PASS — `npx prisma validate` (no schema change; generate not required) |
| Runtime smoke | **RUNTIME_ACCEPTANCE_PENDING_ENVIRONMENT** |

---

## Authority verification

| Field | Result |
|---|---|
| Message lifecycle authority verified | YES — `availableActions` ACTIVE-only + FE capability gate |
| Direct POST bypass prevented | YES — `postMessage` uses `deriveAvailableActions` + `commandConflict` |
| Creator cancellation verified | YES — capability presenter + existing `cancel-by-creator` command (source/tests; runtime pending) |
| Realtime Refresh verified | YES — Manual Refresh → `refreshAll`; reconnect → `refreshAll`; no polling |

---

## Debt / blockers

| Field | Value |
|---|---|
| Environment blockers | Local Brand/Creator runtime smoke not run |
| G1A debt retained | Runtime smoke pending |
| G1R debt retained | Prettier/ESLint on 3 Brand-UCE files; no dedicated Brand-UCE approve integration test — not touched |
| New compatibility debt | None |
| Unexpected Product/backend requirements | None |

---

## Merge / deployment status

Not merged. Not deployed. Committed and available on GitHub (`origin` + `piyush`).

---

## Final disposition

**ACCEPTED WITH DEBT**

Debt: runtime smoke pending local Brand/Creator environment (`RUNTIME_ACCEPTANCE_PENDING_ENVIRONMENT`). Consolidated Collaboration functional acceptance remains after G1C.
