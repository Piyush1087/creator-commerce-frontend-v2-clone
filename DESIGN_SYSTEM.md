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

## Mobile Responsive Contract

This section is the source of truth for mobile layout. Use it for every new
port and every existing-page audit. App shell owns chrome; each feature owns
its own content responsive CSS.

### Breakpoints

| Range | Width | Expected layout |
| --- | --- | --- |
| Mobile | `max-width: 767px` | Stacked content, full-width CTAs, drawer + bottom nav (authenticated) |
| Desktop | `min-width: 768px` | Multi-column layouts allowed; sidebar on authenticated shell |
| Wide split (optional) | `min-width: 900px` or `1024px` | Only when a feature needs a wider two-column workspace |

Default mobile/desktop cutover is **768px**. Do not invent per-page breakpoint
systems unless the intake note documents why.

### Required transforms below 768px

- Multi-column grids and side-by-side splits become one column.
- Form fields stack to one column.
- Primary / secondary form CTAs become full width.
- Tables become card stacks (not horizontally squeezed tables).
- Modals become bottom sheets (top radius, drag handle, near-full height).
- Authenticated pages clear fixed bottom nav; FAB/sheets sit above
  `var(--height-bottom-nav)`.
- Public marketing shells may use their own drawer/bottom nav, but still follow
  stacking, CTA, overflow, and padding rules below.

### Layout CSS defaults

Prefer mobile-first feature CSS:

```css
.feature-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
  min-width: 0;
}

@media (min-width: 768px) {
  .feature-split {
    grid-template-columns: 1fr 1fr;
  }
}
```

Common requirements:

- Page/feature root: `width: 100%; max-width: 100%; min-width: 0`.
- Flex/grid children with text, cards, tables, or charts: `min-width: 0`.
- Fixed widths on mobile only when paired with `max-width: 100%`.
- Images/media: `width: 100%; max-width: 100%`.
- Long URLs/labels: wrap, truncate, or move into mobile cards
  (`word-break` / `overflow-wrap` as needed).
- Do not use `width: 100vw` for inner page sections.
- Card internal padding stays ≥24px on mobile.
- Do not change border radius by breakpoint.
- Body/input text stays ≥14px.

### Overflow guardrail

A page is not mobile-ready if the **document** scrolls sideways below 768px.

- Horizontal scroll is allowed only for intentional controls (tab lists, snapshot
  carousels), scoped to that component — never the whole page.
- Test at ~375px and ~767px and confirm no document-level horizontal scroll.

### Shell vs feature ownership

| Owner | Responsibility |
| --- | --- |
| `src/layouts/app-shell` | Sidebar ↔ hamburger drawer, sticky header, bottom nav, main content padding |
| Feature CSS under `src/features/<feature>/` | Stacking, full-width CTAs, table→cards, modal→sheet, local overflow |
| Pages under `src/pages/...` | Composition only — do not bury responsive layout in the page file |

Do not “fix mobile” by editing AppShell for a single feature unless the bug is
genuinely in shared chrome.

### Per-page mobile audit (any route)

Point Cursor (or a reviewer) at this file and run against one route:

1. Open the target route at ~375px and ~767px.
2. Confirm required transforms above for every section on the page.
3. Confirm no document-level horizontal scroll.
4. Confirm bottom nav / drawer / FAB / sheet do not clip content.
5. Confirm desktop (`≥768px`) is unchanged.
6. Fix only that feature’s components/CSS unless shell chrome is broken.
7. `npm run lint` and `npm run build` pass.

Copy-paste agent prompt:

```md
Read DESIGN_SYSTEM.md (Mobile Responsive Contract), LAYOUT_DIRECTIVES.md,
and AGENTS.md.

Scope: <route> / <feature folder> only.
Audit and fix mobile below 768px against the Mobile Responsive Contract.
Keep desktop ≥768 unchanged. Aurora only. No page-level horizontal scroll.
Done when the per-page mobile audit checklist passes and lint/build pass.
```

### Ports and new UI

Every Stitch / AI Studio / agent port must ship mobile in the first landing,
not as a later polish pass:

1. Include this file and `LAYOUT_DIRECTIVES.md` in the request.
2. Ask for Aurora tokens, not hardcoded styles.
3. Ask for feature-sliced output, not one giant page.
4. Ask for typed mock data and planned API types.
5. Require explicit mobile transforms from the contract above.
6. Reject output that ships unrelated UI frameworks without an intake note.
7. Reject output that only shrinks the desktop layout or leaves sideways scroll.

## Component Ownership

If a component is generic and reusable, add it to `src/design-system/aurora`.
If it is domain-specific, keep it inside `src/features/<feature>/components`.

Do not promote a component to design-system level until at least two real
features need it.

## AI Output Requirements

When asking AI Studio, Stitch, or another agent for UI, follow
**Ports and new UI** under Mobile Responsive Contract.
