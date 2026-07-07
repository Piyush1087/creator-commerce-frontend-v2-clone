# Creator centre UI intake (2026-07-04)

## Source artifacts

Stitch package: `D:\Work\cursor-repos\creator_centre\`

| Area | Stitch reference | v2 route (mock) |
| --- | --- | --- |
| Home / command center | `home_daily_briefing_desktop` | `/creator/home` |
| Analytics pulse | `insights_content_pulse_desktop` | `/creator/analytics` |
| Media kit editor | `creator_profile_editing_sandbox_real_time_preview` | `/creator/media-kit` |
| Nav shell | `creator_shell_desktop_navigation_update_*` | App shell sidebar (existing) |

Product copy: `creator-commerce-backend-v2/docs/creator-centre/product-docs/`.

## Port rules

- Aurora primitives + `src/features/creator-centre/creator-centre.css`.
- Mock data in `src/features/creator-centre/mock-data/`.
- Pages under `src/pages/creator/centre/` compose feature workspaces only.
- Uses authenticated `AppShellLayout` (no separate centre shell in pass 1).

## Not in scope (this pass)

- Co-pilot API, streaming SSE, HITL confirm
- Public media-kit iframe route
- Mobile assistant FAB / bottom sheet (stitch `mobile_assistant_*`)
