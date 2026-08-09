# Co-pilot Part 5 — silent `autoResume` (frontend)

**Date:** 2026-07-28  
**Scope:** Brand co-pilot FE only (no new backend APIs)

## Behavior

When the latest assistant message includes `validationChecklistData` with:

- `autoResume: true`
- `idempotencyKey` set

…and the brand returns to co-pilot (thread finished loading, or tab becomes visible again), the client calls the **existing** HITL confirm stream once for that key.

- No toast  
- One attempt per key per page lifetime (`silentResumeAttemptedRef`)  
- Manual **Try again** / **Discard** unchanged  
- Does not change HITL consent or business rules — only re-runs confirm so UI can advance if blockers are gone  

Helpers: `findPendingAutoResumeValidation` in `src/features/co-pilot/utils/hitl-message-state.ts`  
Hook: `useBrandCoPilot` → `trySilentAutoResume`

## Backend convention (all modules)

Validation mappers must set `autoResume` intentionally. See:

- `docs/chat-engine/product-docs/change-docs/campaign-engine/CE-CampaignList-part5.md` §14  
- `docs/chat-engine/product-docs/change-docs/collaboration-engine/CE-Collaboration-part5.md` §18  

If a future Part 5 / recovery doc omits `autoResume`, add it before implementation.
