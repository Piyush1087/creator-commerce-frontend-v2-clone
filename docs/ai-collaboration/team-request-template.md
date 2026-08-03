# Team Request Template

Use this when asking a teammate or AI agent to produce frontend work.

```md
Repo: creator-commerce-frontend-v2
Work type: temporary playground | production module | design-system primitive
Feature owner:
Target page/route:
Backend/API needed: yes | no
Schema/types needed: yes | no

Required references:
- AGENTS.md
- LAYOUT_DIRECTIVES.md
- DESIGN_SYSTEM.md
- docs/design-system/README.md

Design constraints:
- Use Aurora tokens and primitives.
- No Tailwind, Shadcn, or utility-first classes.
- Do not create one-off versions of Button/Input/Card/etc.
- Follow DESIGN_SYSTEM.md → Mobile Responsive Contract (ship mobile in the
  first landing; do not defer).

Output shape:
- Page entry:
- Feature components:
- Services/API helpers:
- Types/schemas:
- Mock data:
- Docs to update:

Acceptance checks:
- npm run build
- npm run lint
- desktop visual review
- mobile audit against DESIGN_SYSTEM.md Mobile Responsive Contract
```
