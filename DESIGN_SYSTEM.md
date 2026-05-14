# Aurora Design System Directives

Aurora is the only approved frontend design system for this repo.

## Source Of Truth

- Tokens: `src/design-system/aurora/tokens.css`
- Shared component styles: `src/design-system/aurora/components.css`
- React primitives: `src/design-system/aurora/components`
- Design docs: `docs/design-system`

Reference images from Stitch are visual guidance for spacing, depth, and
atmosphere. Aurora tokens remain the code source of truth.

## Core Rules

- Use CSS variables from `tokens.css`.
- Do not hardcode Aurora colors inside feature code.
- Do not create page-specific copies of buttons, inputs, cards, badges, chips,
  tabs, alerts, or progress bars.
- Prefer not adding Tailwind, utility classes, Shadcn, or unrelated UI
  frameworks; if a ported feature requires them, document the exception in
  `docs/ai-collaboration` and keep usage scoped to that feature.
- Do not reduce card internal padding below 24px on mobile.
- Do not change border radius by breakpoint.
- Do not make body/input text smaller than 14px.
- Keep all body copy on `Source Sans 3`.
- Keep headings and labels on `Satoshi`.

## Approved Visual Tokens

- Primary: `#34D399`
- Secondary/sidebar: `#061F23`
- Tertiary accent: `#F5926E`
- Page surface: `#F8F8F8`
- Card surface: `#FFFFFF`
- Workflow/selected surface: `#F0FDF4`
- Border: `#E5E7EB`
- Text high: `#0E1214`
- Text muted: `#6B7280`
- Error: `#CA0F1C`
- Warning/error surface: `#FFF6F6`
- Disabled surface: `#F3F4F6`

## Responsive Rules

- Desktop uses sidebar navigation.
- Tablet/mobile hide sidebar and use the header hamburger drawer.
- Mobile keeps bottom navigation for top-level areas.
- Tables become card stacks below 768px.
- Form fields stack to one column below 768px.
- Form CTAs become full width on mobile.
- Modals should become bottom sheets on mobile when modals are introduced.

## Mobile Overflow Guardrail

Mobile responsiveness is not accepted if the page has width-wise scroll. Some
sections may visually look responsive but still create horizontal overflow from
fixed widths, grid columns, long labels, tables, shadows, or `100vw` usage.

Rules:

- Prefer `width: 100%` and `max-width: 100%` inside the app shell.
- Use `min-width: 0` on grid/flex children that contain text, cards, tables, or
  charts.
- Avoid `width: 100vw` for inner page sections because it can exceed the visible
  viewport when scrollbars or shell padding exist.
- Avoid fixed pixel widths on mobile unless paired with `max-width: 100%`.
- Long text, URLs, tags, and table values must wrap, truncate, or become mobile
  cards.
- Horizontal scroll is allowed only for intentionally scrollable controls such
  as tab lists, never for the whole page.
- During mobile review, test below 768px and confirm the document itself does
  not scroll sideways.

## Component Ownership

If a component is generic and reusable, add it to `src/design-system/aurora`.
If it is domain-specific, keep it inside `src/features/<feature>/components`.

Do not promote a component to design-system level until at least two real
features need it.

## AI Output Requirements

When asking AI Studio, Stitch, or another agent for UI:

1. Include this file and `LAYOUT_DIRECTIVES.md`.
2. Ask for Aurora tokens, not hardcoded styles.
3. Ask for feature-sliced output, not one giant page.
4. Ask for typed mock data and planned API types.
5. Ask for mobile transformations explicitly.
6. Reject output that ships unrelated UI frameworks without an intake note.
