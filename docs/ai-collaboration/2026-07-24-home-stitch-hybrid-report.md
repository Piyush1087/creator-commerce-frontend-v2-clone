# Home Stitch hybrid re-port (2026-07-24)

## Goal

Port Creator Centre **Home / Daily Briefing** + **Creator Assistant** chat from Stitch, with AppShell + Aurora. Static mock only.

## Screen map (how the 5 Stitch files relate)

| Stitch screen | Local folder | Role in port |
|---|---|---|
| Home (Daily Briefing) - Desktop | `home_daily_briefing_desktop` | Early shell + layout baseline |
| Header & Snapshot Update | `home_daily_briefing_header_snapshot_update` | Welcome + 2×2 snapshot bento |
| Insights & Tasks Update | `home_daily_briefing_insights_tasks_update` | Adds hero opportunity, action required, campaigns, tasks; older assistant chrome |
| **AI Assistant Integrated** | `home_daily_briefing_ai_assistant_integrated_1/2` | **Canonical desktop** — full left column + 30% assistant |
| Home (Daily Briefing) - Mobile | `home_daily_briefing_mobile` | Separate Alex Rivera composition — **not** dual-ported |

**Locked composition:** one responsive Home from **AI Assistant Integrated**. Mobile = same sections (horizontal-scroll snapshot) + FAB/sheet (Master Spec), not the Alex Rivera cards.

## Sections (must match Integrated)

1. Welcome — greeting, last updated, subtitle  
2. Snapshot bento — 4 cards; scroll &lt;768 / 2×2 ≥768  
3. Biggest Opportunity hero (orange eyebrow + green glow)  
4. Action Required list  
5. Active Campaigns + Priority Tasks (stack → 2-col ≥1024)  
6. Creator Assistant — desktop 30% column; mobile FAB + ~80% sheet  

## Chat

**Desktop (AI Assistant Integrated)**  
- Header: ✨ Creator Assistant · Active · close visual/disabled  
- Bubble + suggestion chips · attach | input | send  
- Disclaimer: “AI can make mistakes…”

**Mobile sheet (Bottom Sheet Interface + Action Execution)**  
- 80vh sheet, 24px top radius, drag handle, dim+blur backdrop  
- Header: green sparkle avatar · status (Active / Analyzing…)  
- Green-tint assistant bubbles · pill chips  
- Composer: grey bar + filled green send  
- After draft reply: “Use this draft” / “Edit draft” (static)  
- Disclaimer: “Powered by Aurora Intelligence v4.1”

**Mobile Home canvas**  
- Same Integrated content; responsive stacking (welcome, actions, hero CTAs) + horizontal snapshot scroll  

## Colors (scoped `.cctr-home`)

- Primary `#34d399` · on-primary `#061f23` · opportunity `#f97316`  
- Surfaces `#fff` / `#f8fafc` / outline `#e2e8f0`  

## Files

- `home-briefing-workspace.tsx`
- `creator-assistant/*`
- `creator-centre.css`
- `mock-data/centre-mock.ts`

## Out of scope

- Replacing AppShell with Stitch sidebar/top bar  
- Live co-pilot / briefing APIs  
- Dual Alex Rivera mobile layout  
