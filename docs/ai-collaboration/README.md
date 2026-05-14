# AI Collaboration Workflow

Use this folder to keep external AI work organized before it becomes repo code.

## Folder Purpose

- Store review checklists for AI Studio, Stitch, Gemini, Claude, or agent output.
- Record why an imported prototype was accepted, split, or rejected.
- Keep prompts and artifact notes out of source folders unless they are needed
  at runtime.

## Standard Flow

1. Receive external artifact: prompt, screenshot, prototype, schema, or generated
   code.
2. Save or summarize the artifact in this folder.
3. Review it against `AGENTS.md`, `LAYOUT_DIRECTIVES.md`, and `DESIGN_SYSTEM.md`.
4. If it is only visual, place it under `src/temp/<name>`.
5. If it is approved for product work, split it into pages, features, services,
   schemas, and design-system primitives.
6. Run build and lint before considering it integrated.

## Naming Convention

Use dated, descriptive files:

```text
YYYY-MM-DD-source-topic.md
2026-05-13-ai-studio-create-campaign-review.md
2026-05-13-stitch-campaign-layout-notes.md
```

## Team Prompting Rule

When asking teammates or agents for work, include:

- target repo and branch
- whether the work is temp/prototype or production module
- expected folder placement
- required route path if applicable
- required API/schema boundaries
- design-system constraints
- mobile behavior requirements
- acceptance checks
