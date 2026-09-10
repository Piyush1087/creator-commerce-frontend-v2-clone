# INV-13 — competing runtime writers vs retained schema

Canonical proof lives on the backend freeze package:

`creator-commerce-backend-v2/docs/ai-collaboration/mvp-canonical-freeze/phase-d-invariants/inv-13-competing-writers.md`

Frontend C-04 client already uses `fulfillment/*`, `production/submit-deliverable`, and `publishing/*`. Leftover Brand Collab HTTP, marketplace command writes, and Brand UCE `UceCampaignCollaboration` writes are retired `410` on the backend. Table retained. No Prisma drop.

