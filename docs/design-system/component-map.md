# Aurora Component Map

## React Primitives

- `Button` supports `primary`, `secondary`, `outline`, `ghost`, and `disabled`.
- `Card` provides standard and compact elevated surfaces.
- `TextField` supports input and textarea states, including error visuals.
- `SelectField` covers simple dropdowns until a richer select is needed.
- `Badge` and `Chip` cover status and filter tags.
- `SelectionCard` covers 2-4 mutually exclusive visual choices.
- `Alert` covers success, warning, and error feedback.
- `ProgressBar` covers linear progress.
- `Tabs` covers segmented content switching.

## Layout Pieces

- `AppShell` composes the dashboard page.
- `AppSidebar` is desktop-only primary navigation.
- `AppHeader` owns breadcrumbs, notification placeholder, and hamburger trigger.
- `MobileNavigation` owns the right-side drawer and sticky bottom nav.

## Current Playground

`src/temp/aurora-playground/AuroraPlayground.tsx` renders mock UI for reviewing
the design system. It should not call APIs or import backend data.
