# Frontend Review Checklist

Use this before accepting generated or teammate frontend code.

## Architecture

- Page is an entrypoint only.
- Feature UI lives under `src/features/<feature>/components`.
- Feature services live under `src/features/<feature>/services`.
- Shared code is genuinely shared.
- `App.tsx` remains app composition only.
- Routes are registered in the intended route files once routing exists.

## Type Safety

- No `any`.
- Domain data is modeled in `types.ts` or schemas.
- API responses and request payloads are typed.
- Unknown external data is parsed or narrowed before use.

## Design System

- Uses Aurora tokens and primitives.
- Does not add Tailwind, Shadcn, or one-off UI systems.
- Does not duplicate button/input/card styles.
- Uses `Satoshi` for headings/labels and `Source Sans 3` for body/input text.
- Includes AI disclaimer where AI-generated results are shown.

## Responsive

Use `DESIGN_SYSTEM.md` → **Mobile Responsive Contract** as the full bar.

- Mobile is tested at ~375px and ~767px.
- Sidebar is hidden on tablet/mobile; hamburger drawer works.
- Forms stack; CTAs are full width where required.
- Tables become card stacks on mobile.
- Modals become bottom sheets on mobile when present.
- Content clears bottom nav / FAB / sheet.
- The page itself has no width-wise scroll below 768px.
- Any horizontal scroll is intentional and isolated to a component, such as tabs,
  not the full document.
- Desktop `≥768px` remains unchanged by the mobile fixes.

## Maintainability

- No component is allowed to grow past roughly 200 lines without a split plan.
- Complex flows are split by step or section.
- State is local or feature-scoped unless proven global.
- Mock data does not leak into real services.

## Verification

- `npm run build`
- `npm run lint`
- visual review of desktop and mobile states
