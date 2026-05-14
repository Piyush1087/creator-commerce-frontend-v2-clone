# External Artifact Intake

Use this checklist before moving AI Studio, Stitch, Gemini, or teammate output
into source code.

## Intake Questions

- What is the artifact source?
- Is it a visual reference, throwaway prototype, or production-ready module?
- Which feature owns it?
- Which role owns the page: brand, influencer, admin, auth, public, or shared?
- Does it require a backend API?
- Does it require a Prisma/schema change?
- Does it introduce new design-system primitives?
- Does it need real routing now?

## Required Review

- Check for Tailwind, utility classes, Shadcn, or duplicate component styling.
- Check for `any`, untyped stores, giant files, and global state dumping.
- Check whether page files are doing feature work.
- Check whether API/domain types are modeled.
- Check whether mobile behavior is explicitly implemented.
- Check whether tables become mobile card stacks.
- Check whether all colors/radii/spacing use Aurora tokens.

## Possible Outcomes

- `Accept as temp`: place under `src/temp/<name>` with mock data.
- `Accept with split`: split into page, feature components, services, schemas,
  and types.
- `Redo`: use the artifact only as reference and ask for a new implementation.
- `Reject`: do not import because it violates architecture or design rules.

## Notes Template

```md
# YYYY-MM-DD Artifact Review: <name>

Source:
Purpose:
Owner feature:
Target route:
Backend/API needed:
Decision:

Required changes:
- 

Risks:
- 
```
