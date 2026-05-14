# Brand onboarding (ported prototype)

Source material: `aurora-brand-dna` AI Studio prototype (mock-only). This module
implements the same happy-path flow using **Aurora** primitives and
feature-scoped CSS (`brand-onboarding.css`).

## Routes (temporary)

- `/` — marketing landing + URL capture + modals
- `/brand/onboarding/scan` — timed mock scan
- `/brand/onboarding/dna` — editable DNA mock
- `/brand/onboarding/catalogue` — product + offer cards
- `/brand/onboarding/competitors` — competitor cards

## Rules

- **No backend calls** here yet; navigation uses `location.state` for the URL
  between steps.
- Prefer extending `schemas/` and `mock-data/` before wiring to
  `src/shared/api`.
