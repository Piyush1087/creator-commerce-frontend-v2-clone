# Brand Centre — frontend readiness audit (pre test run)

**Date:** 2026-05-27  
**Backend audit (full stack):** `creator-commerce-backend-v2/docs/brand-centre/2026-05-27-readiness-audit.md`

---

## What works today (test these)

| Tab | Fetch | UI shell | Data binding |
| --- | --- | --- | --- |
| 1 DNA | ✅ `useBrandCentreDnaData` | ✅ Product layout | ✅ Real values or `-` |
| 2 Intelligence | ✅ on tab activate | ✅ Accordion + drawer | ⚠️ Partial (see gaps) |
| 3 Planner | ✅ on tab activate | ✅ Cards + drawer | ⚠️ Partial (see gaps) |

---

## Tab 1 — expected after deep scan `READY`

| Product field | Source | UI component |
| --- | --- | --- |
| Brand name, logo, handles, market, industry | `GET /dna` → `mapBrandCentreView` | `BrandDNA` |
| Tagline, description, tone | `dna.narrative` | `BrandDNA` |
| Colors, fonts, personas (name) | `dna.identity`, `dna.personas` | `BrandDNA` |
| USPs, offerings, offers, competitors | `mapDnaCatalogView` | `BrandDnaCatalogSections` |
| Budget + 3 pie charts | `GET /dna/budget` | `BudgetManagement` |
| Account placeholders | `GET /dna/account` | `AccountInfrastructure` |
| Deep scan in progress | `GET /scan-status` | `DeepScanStatusBanner` |

**Not wired:** Edit profile, narrative drawer save, add product/collection/offer/competitor, budget modal, public profile link.

---

## Tab 2 — what is bound vs product doc

| Product (`BrandCentre-tab2.md`) | Bound? |
| --- | --- |
| System status, data refreshed | ✅ |
| Zone 1 — impact index + 3 levers | ✅ `baseline.growthImpactMatrix` |
| Zone 1 — reach, engagement, archetypes, quality, SOV donut | ❌ API has `baselineHealth` / `shareOfVoice` — **UI not built** |
| Zone 2 — all leak cards in grid | ❌ Only **first leak** |
| Drawer — telemetry + checklist | ❌ No `GET /leaks/:id` |
| Move to planner / archive | ❌ |

**Error state:** If deep scan not `READY`, tab shows error from API (400).

---

## Tab 3 — what is bound vs product doc

| Product (`BrandCentre-tab3.md`) | Bound? |
| --- | --- |
| NEW_CAMPAIGN / SUGGESTED_UPDATE / AUTO_PAUSE_LOG lists | ✅ filter `cardType` |
| Objective, tier, hook, workflow on cards | ✅ or `-` |
| Consolidation health % | ❌ static UI |
| Pending tasks sidebar | ❌ static UI |
| Full drawer asset matrix | ❌ needs `GET /planner/cards/:id` |
| Launch / discard / approve | ❌ |

---

## Files to touch for P0 UI gaps

| Task | File |
| --- | --- |
| Tab 2 baseline §2–3 | `components/IntelligenceGaps.tsx` |
| Tab 2 all leaks | `components/IntelligenceGaps.tsx` |
| Tab 2 drawer detail | `api/brand-centre-client.ts` + `IntelligenceGaps.tsx` |
| Tab 3 dynamic sidebar | `components/CampaignPlanner.tsx` |

---

## Display rule

All tabs use `displayField()` / `EMPTY_FIELD` (`-`) for missing data — per current agreement. Product docs eventually want hide-empty.
