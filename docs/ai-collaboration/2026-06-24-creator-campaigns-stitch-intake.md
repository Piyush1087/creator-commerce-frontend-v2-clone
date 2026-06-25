# Creator campaigns UI intake (2026-06-24)

## Source artifacts

Stitch package: `stitch_v2_campaign_creator_view/`

| Screen | Primary stitch reference |
| --- | --- |
| Marketplace discovery | `marketplace_aligned_creator_shell_design_system_1` |
| Filter strip | `marketplace_filter_sorting_control_strip` |
| Campaign detail shell | `marketplace_v2_campaign_detail_aligned_shell` |
| Teaser / pre-OAuth | `marketplace_v2_pre_social_connect_state_a.1` |
| Application wizard | `marketplace_v2_3_step_application_wizard` |
| Command center | `command_center_active_production_workspace_v2` |
| Panic panel | `command_center_critical_velocity_panel_v2` |
| Pending pipeline | `command_center_pending_applications_pipeline_v2` |
| Creator nav shell | `creator_shell_desktop_navigation_update_5` |

Product copy: `creator_campaigns_command_center.txt`, backend `docs/campaigns-creator-view/product-docs/`.

## Port rules

- Aurora primitives + `src/features/creator-campaigns/creator-campaigns.css` only.
- No Tailwind in production routes; stitch spacing mapped to Aurora tokens.
- Mock data in `src/features/creator-campaigns/mock-data/` — no API calls in this pass.
- Pages under `src/pages/creator/` compose feature components only.

## Routes (UI shell)

| Route | Page |
| --- | --- |
| `/creator/marketplace` | Marketplace grid |
| `/creator/marketplace/:campaignId` | Campaign detail (+ wizard overlay) |
| `/creator/campaigns` | Command center |
| `/creator/campaigns/history` | Closed archive |

## Not in scope (this pass)

- API wiring, OAuth, eligibility engine
- Brand UCE wizard visibility fields UI
- Payouts tab from stitch shell
- Public brand landing page (`public_landing_page_*`)
