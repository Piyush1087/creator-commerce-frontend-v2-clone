# Aurora Design System

Aurora is the app design system for the v2 frontend. It is intentionally kept
separate from product features so modules can be added without mixing design
tokens, layout shell, and business logic.

## Source References

The current baseline comes from:

- `AURORA DESIGN SYSTEM v4.1.md`
- `gemini.md v2.md`
- `marketing design system.md`
- `stitch to Ai studio.md`
- the supplied Stitch visual reference image

When the image and tokens disagree, use the Aurora tokens as the code source of
truth. The image is used for atmosphere, spacing, and visual depth.

## Folder Map

- `src/design-system/aurora/tokens.css` contains canonical CSS variables.
- `src/design-system/aurora/components.css` contains shared component classes.
- `src/design-system/aurora/components` contains typed React primitives.
- `src/layouts/app-shell` contains the dashboard shell, sidebar, header, drawer,
  and mobile bottom nav.
- `src/temp/aurora-playground` contains mock-only validation screens.

## Core Tokens

- Primary: `#34D399`
- Secondary/sidebar: `#061F23`
- Tertiary accent: `#F5926E`
- Page surface: `#F8F8F8`
- Card surface: `#FFFFFF`
- Workflow/selected surface: `#F0FDF4`
- Border: `#E5E7EB`
- Error: `#CA0F1C`
- Warning surface: `#FFF6F6`

## Rules

- Use CSS variables from `tokens.css`; do not hardcode colors in feature code.
- Use 12px radius for standard cards and 8px radius for buttons, inputs, badges,
  and compact cards.
- Keep 24px internal card padding on mobile.
- Sidebar is desktop only. Tablet/mobile use the header menu and mobile bottom
  navigation.
- Tables must become card stacks on mobile.
- Mobile layouts must not create page-level horizontal scroll. Use `min-width: 0`
  in grid/flex children, avoid inner `100vw` sections, and keep fixed-width
  visuals capped with `max-width: 100%`.
- Include the disclaimer where AI-assisted output is shown:
  `AI can make mistakes. Verify the results.`
