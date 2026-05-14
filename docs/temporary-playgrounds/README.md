# Temporary Playgrounds

Temporary playgrounds are visual-only review pages. They are allowed to use mock
content and should not call real APIs.

The initial page is:

```text
src/temp/aurora-playground/AuroraPlayground.tsx
```

It is currently rendered by `src/app/App.tsx` so opening the frontend shows the
Aurora design system immediately.

Remove or route this page behind an internal path before real production
screens replace it.
