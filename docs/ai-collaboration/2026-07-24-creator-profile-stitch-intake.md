# Creator Profile UI intake (2026-07-24)

## Sources

- Product: `creator-commerce-backend-v2/docs/creator-centre/product-docs/updated-doc/Creator Centre- Creator Profile.md`
- Stitch package: `D:\Work\cursor-repos\stitch_creator_centre\`
  - `creator_profile_desktop_storefront_framework_*`
  - `creator_profile_editing_sandbox_real_time_preview`
  - `creator_profile_portfolio_performance_modules_integrated`
  - `creator_profile_collaborations_rates_matrix_integrated`
  - `creator_profile_matchmaking_visibility_controls_integrated_*`

## What landed (FE)

- Centre tab label: **Media Kit → Profile** (`?tab=media-kit` unchanged for URLs)
- New workspace: `src/features/creator-centre/components/creator-profile-workspace.tsx`
- Aurora port (no Tailwind): health strip, bio, niche placeholders, featured content placeholders, metric visibility toggles (wired), collaborations logos, rates (2 wired + 2 `-`), theme, live preview card
- `Toggle` exported from `src/design-system/aurora`

## Wired APIs

- `GET/PATCH /api/v1/creator-centre/media-kit` — bio, theme, rates (reel/story), visibility flags, brand logos, public link copy

## Still `-` / disabled (product ahead of BE)

- Profile health score + checklist completion
- Niche categories / edit categories
- Featured portfolio pins (max 6)
- Saves / response rate / repeat collab metrics
- Carousel + bundle rates
- Matchmaking prefs + discovery visibility radios
- Preview Profile / Work with Me / Improve with AI / Manage Portfolio|Collaborations
- Public React storefront page (API JSON only)

## Port rules

- Aurora + `creator-centre.css` (`cctr-` prefix)
- Do not paste Stitch Tailwind HTML into production routes
