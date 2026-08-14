# Collaboration Phase G — G0.2C Interaction, Recovery & Functional Mobile

**Status:** COMPLETE (source investigation only)  
**Captured:** 2026-08-14  
**Scope:** G0.2C ONLY — no runtime source changes, no Stitch, no merge, no deploy  
**Inputs:** `00_baseline.md`, `01_g0_reality_audit.md`, `02_…`, `03_…`, Product G0.2C prompt  

All prior Product freezes remain in force.

---

## 1. Executive interaction / recovery summary

| Finding | Verdict |
|---|---|
| COL-G0-006 | One global error string; no pane ownership, retry, or status-specific recovery |
| COL-G0-007 | Product message policy frozen; BE always seeds `PostCollaborationMessage` and POST has no lifecycle gate; FE composer always enabled |
| COL-G0-014 | Degraded notice + reconnect refetch exist; **manual Refresh** missing; polling not required for MVP |
| COL-G0-016 | Loading/empty/busy/read-only states incomplete (blank empty chat; no send busy; no read-only) |
| COL-G0-018 | Creator mobile bottom nav has no Collaborations entry (Brand does) |
| COL-G0-019 | 768–1023 uses stepped mobile layout and is functionally operable; Creator access + deep-link step are the functional blockers, not the 1024 cutover |

### Product freezes applied in this prompt

**Fulfillment issue UX (COL-G0-009)** — MVP: no user-facing taxonomy; description-first mandatory form; optional evidence; no invented categories; opaque `issueCode` transport OK temporarily; UI must not display/interpret it as taxonomy; remediation stays sequence-driven.

**Counterpart context MVP (COL-G0-010)** — No new relationship-history endpoint in Phase G MVP. Compose already-projected Collaboration detail only:

| Direction | Fields |
|---|---|
| Brand → Creator | display name, handle when available, Campaign, Campaign Asset, Brief |
| Creator → Brand | Brand name, Campaign, Campaign Asset, Brief |

Do not fabricate history / Intelligence / Trust / Brand analytics / cross-Campaign history. Keep detailed commercial/execution in Execution Hub.

---

## 2. Message lifecycle enforcement (COL-G0-007)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-007 |
| Confirmed root cause | Frozen Product policy requires send only when ACTIVE via `availableActions`. Current BE seeds `PostCollaborationMessage` for every lifecycle (including COMPLETED/PAUSED/CANCELLED/TERMINATED and legacy). `postMessage` checks ownership only. FE composer ignores capabilities and is always enabled; CompletedPanel says chat is still available. |
| Exact frontend files | `CollaborationWorkspace.tsx` (composer ~55,66–68); `utils/collaboration-capabilities.ts` (maps `message` unused by composer); `components/execution/CompletedPanel.tsx` |
| Exact backend files/services | `utils/collaboration-thread.mapper.ts` `deriveAvailableActions` (~281–307); `services/collaboration.service.ts` `postMessage` (~135–168) |
| Canonical authority | Product freeze + `availableActions`; HTTP POST must enforce same rule |
| Functional state model | History always visible when thread loaded; composer `enabled` only if detail `availableActions` includes `PostCollaborationMessage`; otherwise `read_only` |
| Frontend change required | YES — gate composer on capabilities after hydrate; read-only copy; fix CompletedPanel |
| Backend change required | YES — omit `PostCollaborationMessage` when lifecycle ≠ ACTIVE; reject POST with invalid-state style error |
| Automatic recovery behavior | After lifecycle-changing command / refetch, composer gates flip from authority (no local lifecycle switch) |
| Manual recovery behavior | N/A beyond normal refetch |
| Required copy/state semantics | Messaging closed / conversation history only — never “chat still available” on terminal |
| Required regression tests | Terminal/PAUSED omit action; POST rejected; composer gated; ACTIVE still sends |
| Mobile implications | Same gate on stepped chat pane |
| Remaining Product decision | Pause command surface still deferred (PAUSED may be rare until Pause exists) — policy itself is frozen |
| Recommended G1 scope | BE mapper + POST reject + FE composer/copy |
| Stitch relevance | NO |

**Do not** re-encode lifecycle lists in the frontend if `availableActions` expresses sendability.

---

## 3. Error / recovery matrix (COL-G0-006)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-006 |
| Confirmed root cause | Workspace `error: string \| null` absorbs inbox, detail, messages, send, and (via hub) many command failures. Client retains `status`/`code` but UI shows message only. Successful loads do not clear the alert. Selection change clears detail before hydrate, so non-silent fail leaves empty panes. |
| Exact frontend files | `CollaborationWorkspace.tsx`; `utils/parse-collaboration-api-error.ts`; `api/collaboration-client.ts` (`CollaborationCommandError`); `CollaborationExecutionHub.tsx` (`actionError`, stale → refresh) |
| Exact backend files/services | Nest JWT/validation; `collaboration-access.service.ts` (404 for miss/unauthorized); `errors/collaboration-command.error.ts` |
| Canonical authority | HTTP status + command codes; socket never owns workflow truth |
| Functional state model | Pane-local errors; retain hydrated data where possible; typed recovery actions |
| Frontend change required | YES — pane ownership, dismiss/retry, map 404 to frozen unavailable copy, clear stale alerts |
| Backend change required | NO for MVP (optional clearer read codes later) |
| Automatic recovery behavior | 409 stale already triggers `refreshAll` from execution hub — keep |
| Manual recovery behavior | Retry / Refresh / Back to Collaborations / re-auth as below |
| Required copy/state semantics | Use frozen deep-link unavailable copy for 404; no stacks, tokens, aggregateVersion, raw JSON, debug enums |
| Required regression tests | Each status class below; data retention; 404 copy |
| Mobile implications | Alerts must not obscure primary Back / Refresh |
| Remaining Product decision | Soft copy for 401/403 only if Product wants branded strings |
| Recommended G1 scope | Error model + recovery with COL-G0-002 unavailable state |
| Stitch relevance | NO |

### Functional freeze matrix

| Case | Owning surface | Keep loaded data? | Auto-refetch | User action | Must NOT appear |
|---|---|---|---|---|---|
| 400 validation | Command/composer pane | Yes (draft/history) | No | Fix input / retry | Stack / DTO debug paths |
| 401 session | App/session | Prefer keep until redirect | No | Re-login | Tokens / JWT |
| 403 unsupported | Pane / hub | Yes if previously loaded | No | Switch account / unsupported-access | Raw role jargon |
| 404 unavailable | Selection / chat | Do not pretend selected | No | Back to Collaborations | Ownership enumeration |
| 409 stale | Execution + notice | Yes after refresh | Yes (one refresh) | Manual Refresh if still stale | aggregateVersion / commandId |
| 5xx | Pane | Silent hydrate keeps prior; else failed_with/without data | Bounded retry optional | Retry / Refresh | Nest names / hostnames |
| Network | Pane | Same as 5xx | After connectivity | Retry | CORS internals |
| Malformed read | Detail/messages | Prefer failed_with_data | No | Refresh / escalate | Raw body / legacy debug fields |
| Message-send fail | Composer | History + draft | No | Retry Send | Same as 4xx/5xx |
| Socket disconnect | Workspace notice | Yes | Socket.io reconnect | Manual Refresh | Socket dumps |
| Socket reconnect | Workspace | Yes | `refreshAll` | None if OK | Socket payloads as truth |
| Partial detail/messages | Prefer split fetches in G1 | Keep last good half | No auto-loop | Refresh | Half-applied socket diffs |

---

## 4. Loading / empty / processing state matrix (COL-G0-016)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-016 |
| Confirmed root cause | Inbox has loading/empty text; detail clears then shows loading text; message feed blank when zero; composer has no busy/disable; read-only lifecycle not modeled; execution hub has stage/paused/terminal/completed but no contract-failure state |
| Exact frontend files | `CollaborationWorkspace.tsx`; `CollaborationExecutionHub.tsx`; contracts unused `projectionSource` / `legacyCompatibility` |
| Exact backend files/services | Standard list/detail/messages endpoints |
| Canonical authority | FE state presentation over HTTP authority |
| Functional state model | See matrices below |
| Frontend change required | YES |
| Backend change required | NO |
| Automatic recovery behavior | N/A beyond normal hydrate |
| Manual recovery behavior | Retry on failed panes |
| Required copy/state semantics | Distinct empty vs loading vs read-only; no blank “dead” chat |
| Required regression tests | Empty messages copy; send busy; read-only composer |
| Mobile implications | Same states on steps 1–3 |
| Remaining Product decision | None for semantics |
| Recommended G1 scope | With error model + message lifecycle |
| Stitch relevance | UNKNOWN (copy only) |

### Frozen functional states

**INBOX:** `loading` | `empty` | `loaded` | `failed` (keep prior rows if refetch fails)

**SELECTION:** `none` | `deep_link_resolving` | `unavailable` (frozen 404 copy) | `selected`

**DETAIL:** `loading` | `loaded` | `failed_with_data` | `failed_no_data`

**MESSAGES:** `loading` | `empty_zero` | `loaded` | `send_in_progress` | `send_failed` | `read_only`

**EXECUTION HUB:** `loading` | `canonical_active` | `compatibility_bounded` | `blocked` | `paused` | `terminal` | `completed` | `contract_read_failure`

---

## 5. Realtime degraded behavior (COL-G0-014)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-014 |
| Confirmed root cause | Disconnect → `degraded` notice; hydrated data retained; Socket.IO auto-reconnect; reconnect runs `refreshAll`. Events only carry `{type, collaboration_id, at}` then HTTP hydrate. **No manual Refresh control.** No polling today. |
| Exact frontend files | `hooks/use-collaboration-realtime.ts`; `api/collaboration-socket-client.ts`; `CollaborationWorkspace.tsx` notice + `refreshAll` |
| Exact backend files/services | Realtime broadcast invalidate-only |
| Canonical authority | Persisted HTTP |
| Functional state model | `connected` \| `degraded` \| `disabled`; workspace usable in degraded |
| Frontend change required | YES — expose Manual Refresh → existing `refreshAll` |
| Backend change required | NO |
| Automatic recovery behavior | Reconnect refetch — keep |
| Manual recovery behavior | Refresh while degraded |
| Required copy/state semantics | Keep “live updates temporarily unavailable”; do not imply data is corrupt |
| Required regression tests | Degraded retains data; Refresh refetches; reconnect refreshes; no socket-history reconstruction |
| Mobile implications | Refresh reachable on each mobile step |
| Remaining Product decision | Confirm **no** bounded polling for MVP (recommended) |
| Recommended G1 scope | Manual Refresh only |
| Stitch relevance | NO |

### Recommendation

**Manual Refresh + reconnect-refetch is sufficient for MVP.**  
Do **not** add bounded fallback polling merely because the socket is disconnected. Socket already retries; polling duplicates authority paths and load. Revisit only if production telemetry shows reconnect failure rates that break usability.

---

## 6. Mobile functional navigation / access (COL-G0-018)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-018 |
| Confirmed root cause | Brand bottom nav includes Chat → Collaborations. Creator bottom nav is Home / Insights / Profile / Campaigns — **no Collaborations**. Creator can still reach via hamburger drawer (sidebar includes Chat), desktop sidebar, or deep links from Campaigns/Payouts. Product freeze: Creator must have mobile shell entry to operational Collaborations. |
| Exact frontend files | `layouts/app-shell/bottom-nav-items.ts`; `layouts/app-shell/sidebar-items.ts`; `MobileNavigation.tsx`; routes in `app-routes.tsx` / `auth/constants.ts` |
| Exact backend files/services | None |
| Canonical authority | App shell navigation + operational routes from G0.2A |
| Functional state model | Mobile steps 1 inbox → 2 chat → 3 execution; Back decrements; pick sets `?thread=` |
| Frontend change required | YES — add Creator bottom-nav Collaborations entry (mirror Brand); also deep-link should open chat step when id resolves |
| Backend change required | NO |
| Automatic recovery behavior | N/A |
| Manual recovery behavior | Nav entry + Back |
| Required copy/state semantics | Label may be Chat or Collaborations — Product slot choice |
| Required regression tests | Creator bottom nav reaches `/creator/collaborations`; deep-link lands on chat step; selection preserved across Back |
| Mobile implications | Primary blocker for Creator mobile access |
| Remaining Product decision | Which of four bottom-nav slots to replace/add if constrained to four items |
| Recommended G1 scope | Shell bottom-nav + deep-link → `mobileStep` 2 |
| Stitch relevance | UNKNOWN (icon/label only) |

### Mobile flow notes

| Concern | Current | G1 need |
|---|---|---|
| Inbox → Chat → Execution | Works when workspace open | Keep |
| Back | Decrements step | Keep |
| Selection / `?thread=` | Preserved on pick | Keep |
| Deep-link entry | Selects id but **`mobileStep` stays 1** | Open step 2 when resolved |
| Drawers | Context SideDrawer from chat header | Compose MVP fields (COL-G0-010); Product copy (011) |
| Bottom nav clearance | CSS accounts for `--height-bottom-nav` ≤1023 | Keep |

---

## 7. Breakpoint functional findings (COL-G0-019 inspect only)

| Field | Finding |
|---|---|
| Finding ID | COL-G0-019 (functional slice only) |
| Confirmed root cause | `<1024` uses single-pane stepped mobile; `≥1024` three columns. 768–1023 shares mobile flow with phone and is **functionally usable** if Collaborations is reachable. Pure Aurora/visual debt stays G2/G3/G4. |
| Exact frontend files | `components/collaboration-workspace.css` (~13–37, 350–370, 411–420); workspace mobile markup |
| Exact backend files/services | None |
| Canonical authority | Functional access first; composition later |
| Functional state model | Same as mobile steps below 1024 |
| Frontend change required | Only functional access/deep-link items (018/002); no visual redesign in G0.2C/G1 for debt alone |
| Backend change required | NO |
| Automatic / manual recovery | N/A |
| Required copy/state semantics | N/A |
| Required regression tests | Creator can open Collaborations at 768–1023; deep-link usable |
| Mobile implications | Cutover itself is not the Creator blocker |
| Remaining Product decision | G2 composition / breakpoint preference |
| Recommended G1 scope | Do not redesign; fix 018 access + deep-link step |
| Stitch relevance | G2+ |

### Functional vs visual

| Issue | Class |
|---|---|
| Creator missing bottom-nav Collaborations | Functional |
| Deep-link stays on inbox step | Functional |
| No manual Refresh while degraded | Functional |
| Always-on composer vs lifecycle | Functional (007) |
| 9px chips / hardcoded colors / custom cards | Visual preference / debt |

---

## 8. Direct-G1 carry-forward register

| ID | Frozen / expected G1 work |
|---|---|
| COL-G0-008 | Creator cancellation presenter (client + capability exist) |
| COL-G0-011 | Replace technical drawer copy with Product empty/unavailable language |
| COL-G0-009 | Description-first Fulfillment issue UX (no taxonomy; opaque code OK) |
| COL-G0-010 | Compose existing detail fields only (name/handle/Campaign/Asset/Brief) |

---

## 9. Remaining Product decisions

| Topic | Status |
|---|---|
| Fulfillment issue UX | Frozen in G0.2C §1 |
| Counterpart context MVP | Frozen in G0.2C §2 |
| Message lifecycle send policy | Frozen (enforce in G1) |
| Deep-link unavailable copy | Frozen in G0.2B |
| Creator bottom-nav slot tradeoff | **OPEN** if limited to four items |
| Bounded polling while degraded | **Recommended NO** — confirm |
| G2 visual/breakpoint composition | Deferred |

---

## 10. Recommended G1 grouping (from G0.2C + carry-forward)

1. **Access & deep-link** — COL-G0-001, 002 (+ frozen unavailable copy); Creator bottom nav COL-G0-018; deep-link → chat step
2. **Message lifecycle** — COL-G0-007 (BE + FE)
3. **Error / loading / recovery** — COL-G0-006, 016, 014 (manual Refresh)
4. **Fulfillment honesty** — COL-G0-009 (description-first)
5. **Counterpart UX** — COL-G0-010 compose + COL-G0-011 copy
6. **Creator cancel** — COL-G0-008
7. **Bank cutover** — COL-G0-012 (from G0.2B)
8. **Read validation / env / tests / legacy** — COL-G0-004, 015, 020, 013 (from G0.2A)
9. **Settlement adapter** — COL-G0-022 remains DEFERRED_OWNER

Visual COL-G0-019 debt stays G2+.

---

## 11. G0.2C completion assessment

- Fulfillment and counterpart Product freezes recorded and mapped to COL-G0-009 / 010
- COL-G0-006 / 007 / 014 / 016 / 018 investigated; COL-G0-019 functionally inspected only
- Realtime recommendation: manual Refresh + reconnect-refetch; no MVP polling
- Mobile blocker: Creator bottom-nav entry (+ deep-link step)
- Direct-G1 008 / 009 / 010 / 011 carried forward
- No runtime/CSS/Prisma/config/Stitch changes in this task
- Stops before G0.3 and G1
