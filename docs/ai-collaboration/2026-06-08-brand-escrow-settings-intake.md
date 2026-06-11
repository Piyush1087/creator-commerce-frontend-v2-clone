# Brand escrow settings UI intake (2026-06-08)

## Source material

- Stitch reference: `stitch_remix_of_campaign_page_3005/stitch_escrow_ui` (read-only prototype)
- Product copy: backend `docs/escrow/product-docs/` (read-only)

## Architecture

- Settings is a brand route group under `src/pages/brand/settings/`.
- Escrow UI lives in `src/features/brand-escrow/` and is composed from settings pages.
- Sub-routes: `/brand/settings/billing`, `/brand/settings/escrow`.
- Static mock data only; API wiring follows in a later pass.

## Responsive rule

- Mobile layout: `max-width: 767px` (matches app shell).
- Tablet, laptop, and desktop share the desktop layout (`min-width: 768px`).
