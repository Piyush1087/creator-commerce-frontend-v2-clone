# Shell-owned Creator Centre (2026-07-24)

## Decisions

- Shell owns **Home / Insights / Profile** (sidebar + bottom nav). No in-page centre tabs or mobile dropdown.
- Assistant: Stitch visuals; Master Spec behavior.
- Profile: Master Spec sections 1–12 as UI (static where unwired).

## Routes

| Label | Path |
|---|---|
| Home | `/creator/home` |
| Insights | `/creator/analytics` |
| Profile | `/creator/media-kit` |

Legacy: `/creator/dashboard` → Home; `?tab=analytics|media-kit` → Insights / Profile.

## Assistant

- Desktop: Home only, 30% full-height column beside briefing.
- Mobile: FAB + ~80% bottom sheet on Home, Insights, Profile via `CreatorCentreShell`.

## Profile checklist (UI)

1. Title strip · 2. Health · 3. Editor/preview · 4. Bio · 5. Niche · 6. Featured · 7. Why Brands · 8. Collaborations · 9. Rates · 10. Accepting/Ideal · 11. Visibility · 12. Suggestions/Recent/Share/footer

Save still wires media-kit bio/theme/reel/story/visibility/logos.
