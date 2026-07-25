# Creator Centre Stitch static port (2026-07-24)

## Goal

Replace bare `-` placeholders with Aurora ports of Stitch reference screens using static demo content from `D:\Work\cursor-repos\stitch_creator_centre\`.

## Screens ported

| Centre tab | Stitch sources | Component |
|---|---|---|
| Command Center | `home_daily_briefing_*` | `home-briefing-workspace.tsx` |
| Analytics | `insights_content_pulse_*` | `analytics-pulse-workspace.tsx` |
| Profile | `creator_profile_*` | `creator-profile-workspace.tsx` |

## Data

- Static copy/numbers live in `src/features/creator-centre/mock-data/centre-mock.ts`
- UI shows a **Stitch reference content** chip
- Profile **Save** still PATCHes live media-kit fields (bio, theme, reel/story rates, visibility, logos)

## Not in this pass

- Real co-pilot chat / FAB
- Live Meta pulse replacing Insights table
- Prisma niches / portfolio / discovery enums
- Pasting Stitch Tailwind HTML into routes
