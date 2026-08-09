# Creator onboarding UI intake (2026-07-04)

## Source artifacts

Stitch package: `D:\Work\cursor-repos\creator-onboarding\`

| Step | Stitch reference | v2 route (mock) |
| --- | --- | --- |
| Landing + handle | `the_creator_shop_landing_page` | `/creator/onboarding` |
| Module staging | `onboarding_priority_selection_modal` | `/creator/onboarding/modules` |
| Signup | `account_creation_desktop` / `account_creation_mobile` | `/creator/onboarding/signup` |
| Meta connect | `post_auth_account_selection_desktop` | `/creator/onboarding/connect` |
| AI sync gate | `value_creation_workspace_building_desktop` | `/creator/onboarding/sync` |
| Post-sync home (preview) | `creator_os_home_dashboard_redesigned_layout` | `/creator/home` (centre) |

Product copy: `creator-commerce-backend-v2/docs/creator-onboarding/product-docs/`.

## Port rules

- Aurora primitives + `src/features/creator-onboarding/creator-onboarding.css` only.
- No Tailwind in production routes; stitch spacing mapped to Aurora tokens.
- Mock data in `src/features/creator-onboarding/mock-data/` — **no API calls** in this pass.
- Pages under `src/pages/creator/onboarding/` compose feature components only.
- Shell: `src/layouts/creator-onboarding-shell/` (public funnel chrome).

## Not in scope (this pass)

- API wiring, OAuth, OTP email, Google token exchange
- Waitlist / eligibility API
- Error resolution wizards (duplicate handle, personal IG)
