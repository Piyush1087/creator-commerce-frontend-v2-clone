# Brand Centre — Stitch UI vs API data gap panel

**Date:** 2026-05-27

## Purpose

Product provided Stitch layouts for Tabs 2 and 3. Engineering wired **real** `GET /intelligence` and `GET /planner` data into that layout without redesigning the canvas.

Some requirement fields exist in the API but are **not** in the Stitch file. To avoid silent mismatch during QA, each tab shows an additional section **below** the Stitch UI:

**“API data present — not shown in product UI above”**

Use this in reviews with product: backend returns the data; a future UI pass can promote fields into the main design.

## Where in code

| Piece | Path |
| --- | --- |
| Panel component | `src/features/brand-centre/components/BrandCentreStitchDataGap.tsx` |
| Tab 2 sections | `src/features/brand-centre/utils/map-intelligence-stitch-gap.ts` |
| Tab 3 sections | `src/features/brand-centre/utils/map-planner-stitch-gap.ts` |
| Styles | `src/features/brand-centre/brand-centre.css` (`.brand-centre-stitch-data-gap*`) |

## Tab 2 — typically in gap panel only

- `baseline.baselineHealth` (Zone 1 §2)
- `baseline.shareOfVoice` (Zone 1 §3)
- `baseline.source`
- `deepIntelStatus`, `refreshJob`
- Full `leaks[]` list (Stitch shows one card)
- Drawer payload (`drawerDeepDive`) — requires `GET /intelligence/leaks/:id`

## Tab 3 — typically in gap panel only

- `totalCards`, `grouped`
- Full card summaries (`workflowStatus`, `createdAt`, `existingTargetCampaignId`, …)
- `campaignMetadata` / `assetsAndBriefsMatrix` — on `GET /planner/cards/:id` only

## Tab 1

No gap panel for now (Stitch Tab 1 is wired for read display). Persona demographics and drawer-only fields may be added later if needed.
