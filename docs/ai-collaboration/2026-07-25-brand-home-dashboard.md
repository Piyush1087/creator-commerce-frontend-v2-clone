# Brand Home Dashboard (2026-07-25)

## Login

- Brand post-login home: `/brand/dashboard` (`getHomeRouteForRole` → `brandDashboard`).

## Layout (Creator Home parity)

| Region | Content |
|---|---|
| Left ~70% | Static Daily Briefing (brand mock) |
| Right ~30% desktop | Live Brand Co-Pilot (`useBrandCoPilot` → `/api/v1/co-pilot/*`) |
| Mobile | Same briefing + FAB/sheet assistant (above bottom nav) |

## API (unchanged backend)

- Threads, stream messages, HITL confirm/discard, usage, feedback — existing brand co-pilot module.
- Left column is UI-only static mock (no briefing API yet).

## Shared chat chrome (Brand + Creator)

`src/features/shared/home-assistant/home-assistant-chrome.css`

| Surface | Reference |
|---|---|
| Desktop column | AI Assistant Integrated |
| Mobile sheet | Bottom Sheet Interface |

Keeps both sides aligned: bubbles, suggestion pills, composer (attach/send), fonts, sheet vs desktop variants, data cards inside agent bubbles.

## Files

- `src/pages/brand/dashboard/brand-dashboard-page.tsx`
- `src/features/brand-dashboard/components/*`
- `src/features/brand-dashboard/mock-data/brand-home-mock.ts`
- `src/features/creator-centre/components/creator-assistant/*`
- `src/features/shared/home-assistant/home-assistant-chrome.css`
- `src/features/auth/constants.ts` (home route)
