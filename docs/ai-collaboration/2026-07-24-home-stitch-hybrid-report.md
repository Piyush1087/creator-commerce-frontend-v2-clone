# Home Stitch hybrid re-port (2026-07-24)

## Goal

Port Creator Centre **Home / Daily Briefing** from Stitch screen **Home (Daily Briefing) - AI Assistant Integrated**, with correct Aurora/Stitch colors and mobile responsiveness. Insights and Profile unchanged until Home visual review.

## Canonical source

Package: `D:\Work\cursor-repos\stitch_creator_centre\`

| Item | Value |
|---|---|
| Screen title | Home (Daily Briefing) - AI Assistant Integrated |
| Stitch IDs | `12675783896414047625`, `4c262c8653974673ad7543fe6a369e0e` |
| Local HTML | `home_daily_briefing_ai_assistant_integrated_1` / `_2` (identical) |
| Project | `547300719464114775` |

Shell/nav in Stitch HTML is **not** ported — keep `AppShellLayout` + centre tabs.

## Color tokens (from Stitch `code.html`)

Scoped on `.cctr-home`:

- Primary (Aurora green): `#34d399`
- On-primary / secondary (midnight): `#061f23`
- Surface / surface-low / outline: `#ffffff` / `#f8fafc` / `#e2e8f0`
- On-surface / variant: `#0f172a` / `#64748b`
- Opportunity accent: `#f97316`
- Hero glow: `0 0 15px rgba(52, 211, 153, 0.2)`

## Layout

**One composition** (not a separate Alex Rivera mobile screen):

1. Welcome (greeting + last updated + subtitle)
2. Snapshot bento — horizontal scroll &lt;768px; 2×2 grid ≥768px
3. Biggest Opportunity hero
4. Action Required
5. Active Campaigns + Priority Tasks (stack → 2-col ≥1024px)
6. Creator Assistant — sticky 30% column ≥768px; mobile FAB + slide-over sheet

## Files

- `src/features/creator-centre/components/home-briefing-workspace.tsx`
- `src/features/creator-centre/creator-centre.css`
- `src/features/creator-centre/mock-data/centre-mock.ts`

## Out of scope

- Insights / Profile re-ports
- Live co-pilot / briefing APIs
- Stitch shell replacement
- Tailwind HTML paste

## Next tabs (same method)

1. Insights → `insights_content_pulse_metrics_content_update_2`
2. Profile → `creator_profile_final_completion_optimization_audit_sharing`
