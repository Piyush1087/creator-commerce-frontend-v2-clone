# Brand Centre + Deep Scan — session handoff (frontend)

**Last updated:** 2026-05-27  
**Repo:** `creator-commerce-frontend-v2`  
**Pair with:** `creator-commerce-backend-v2/docs/ai-collaboration/2026-05-27-brand-centre-session-handoff.md`

Use this doc to resume Brand Centre UI work in the next session.

---

## Where things stand

| Tab | UI | Data | Notes |
| --- | --- | --- | --- |
| **Tab 1 — Brand DNA** | Full Aurora UI | Real APIs | Read-only display; edit buttons not wired |
| **Tab 2 — Intelligence** | Original accordion + drawer UI | Real `GET /intelligence` | Missing fields show `-` |
| **Tab 3 — Campaign Planner** | Original card + drawer UI | Real `GET /planner` | Mock card arrays removed; missing fields show `-` |

**Removed:** `mock-data/brand-centre-data.ts` — Tab 1 no longer uses mocks.

**Display rule (temporary):** any null/empty/missing value → **`-`** via `displayField()` / `EMPTY_FIELD`. Product docs eventually want hide-empty instead.

---

## Quick start (next session)

```powershell
cd creator-commerce-frontend-v2
# VITE_API_URL=http://localhost:3000 (or your backend)
npm run dev
```

Backend must be running with migrations applied. See backend handoff for deep scan env keys.

**Login:** verified brand work email + stub OTP → `/brand-centre`.

---

## Page + fetch wiring

**Entry:** `src/pages/brand/brand-centre/brand-centre-page.tsx`

| Tab | Component | Fetch hook | API |
| --- | --- | --- | --- |
| DNA | `BrandDNA`, `BrandDnaCatalogSections`, `BudgetManagement`, `AccountInfrastructure` | `useBrandCentreDnaData` | `/dna`, `/dna/budget`, `/dna/account`, `/scan-status` |
| Intelligence | `IntelligenceGaps` | `useBrandCentreApiJson` (tab active) | `/intelligence` |
| Planner | `CampaignPlanner` | `useBrandCentreApiJson` (tab active) | `/planner` |

Tab 2/3 fetch **only when tab is selected** (lazy load on tab switch).

---

## Key files

| Purpose | Path |
| --- | --- |
| Brand Centre page | `src/pages/brand/brand-centre/brand-centre-page.tsx` |
| API client | `src/features/brand-centre/api/brand-centre-client.ts` |
| Response types | `src/features/brand-centre/contracts/brand-centre.contracts.ts` |
| DNA data hook + polling | `src/features/brand-centre/hooks/use-brand-centre-dna-data.ts` |
| Tab 2/3 fetch hook | `src/features/brand-centre/hooks/use-brand-centre-api-json.ts` |
| Tab 1 view mappers | `src/features/brand-centre/utils/map-brand-centre-view.ts` |
| `-` display helpers | `src/features/brand-centre/utils/display-field.ts` |
| Tab 2 UI | `src/features/brand-centre/components/IntelligenceGaps.tsx` |
| Tab 3 UI | `src/features/brand-centre/components/CampaignPlanner.tsx` |
| Deep scan banner | `src/features/brand-centre/components/DeepScanStatusBanner.tsx` |
| Logout → session evict | `src/shared/auth/use-logout.ts` |
| Auth session sync | `src/shared/auth/use-auth-session-sync.ts` |

---

## Tab 1 — what to expect by scan stage

See detailed steps in `2026-05-27-brand-centre-dna-manual-testing.md`. Summary:

| Stage | Banner | DNA fields |
| --- | --- | --- |
| Surface scan only | Hidden | Many `-` until deep scan |
| `DEEP_SCAN_IN_PROGRESS` | Yellow spinner banner | Still mostly `-`; polls every ~8s |
| `READY` | Hidden | Narrative, personas, budget phase 2, offerings USPs populate |

---

## Tab 2 — Intelligence UI mapping

**Component:** `IntelligenceGaps` — **keep existing layout**; data from `BrandCentreIntelligenceResponse`.

| UI area | API field |
| --- | --- |
| System status row | `systemStatus`, `dataRefreshedAt` |
| Zone 1 — impact index | `baseline.growthImpactMatrix.projectedRevenueLiftPercentage` |
| Zone 1 — levers | `baseline.growthImpactMatrix.levers.*` |
| Zone 2 — top opportunity card | `leaks[0]` (title, description, bucket, lift, priority) |
| Drawer | Same leak fields |

**Not wired yet (buttons disabled / placeholder):** Approve & Move to Planner, archive count, drawer deep-dive sections beyond summary text.

**Backend gate:** If deep scan not complete, `/intelligence` errors — Tab 2 shows error alert.

---

## Tab 3 — Planner UI mapping

**Component:** `CampaignPlanner` — cards from `planner.cards` filtered by `cardType`:

| Section | `cardType` | Fields shown |
| --- | --- | --- |
| Orchestrated Drafts | `NEW_CAMPAIGN` | `aiContextHook`, `objective`, `targetCreatorTier`, `workflowStatus`, `existingTargetCampaignId` |
| Pipeline Suggestions | `SUGGESTED_UPDATE` | same summary fields |
| Auto-Executed Pauses | `AUTO_PAUSE_LOG` | `aiContextHook` (up to 2 rows) |
| Sidebar pending count | — | `totalCards` |

**Not wired yet:** Discard, Launch, Update, drawer asset matrix (drawer shows first card objective/tier only). Right-column “92% consolidation” metrics still static placeholders in layout — show `-` when no data if you extend this.

---

## Auth / session

- Login: `POST /api/v1/auth/login` → JWT stored client-side.
- App shell: `useAuthSessionSync` calls `GET /api/v1/auth/me`.
- Logout: `POST /api/v1/brand-centre/session/evict` then clear token.

Brand DNA is **not** on `/me` — only Brand Centre fetches load it.

---

## Manual test checklist (5 min)

1. Onboard new domain → surface scan completes.
2. Verify email → deep scan job starts.
3. Login → `/brand-centre` Tab 1: banner while scanning, then populated DNA.
4. Tab 2: intelligence loads after `READY` (baseline + leaks or `-`).
5. Tab 3: planner cards or `-` in empty sections.
6. Logout → no errors from evict call.

Full DNA checklist: `2026-05-27-brand-centre-dna-manual-testing.md`.

---

## Likely next session tasks (frontend)

1. **Deep scan E2E** — confirm Tab 1 fields populate after worker; use retry if needed.
2. **Tab 2 actions** — wire “Move to Planner”, leak drawer detail (`GET /intelligence/leaks/:id`), archive list.
3. **Tab 3 actions** — wire approve/discard/acknowledge to planner API routes.
4. **Tab 1 edits** — connect PATCH buttons to `/dna/*` routes.
5. **UX polish** — replace `-` with hide-empty per product; remove deep scan banner when stable.
6. **Tab 3 drawer** — fetch `GET /planner/cards/:id` for full asset matrix instead of summary-only.

---

## Build / lint

```powershell
npm run build   # tsc + vite — should pass
```

---

## Related docs

| Doc | Purpose |
| --- | --- |
| `2026-05-27-brand-centre-dna-manual-testing.md` | Step-by-step Tab 1 E2E |
| Backend handoff | Workers, migrations, deep scan fixes |
| `AGENTS.md` | Frontend structure rules |

---

## Design note (important)

When extending Tab 2/3: **do not replace the Stitch-style UI** with a new Aurora card layout unless explicitly requested. Pattern established this session:

- Keep existing component structure and inline styles.
- Replace hardcoded strings with API values + `displayField()`.
- Loading/error states at top of tab; empty lists → single `-` row.
