# Collaboration — Frontend implementation plan

**Source of truth (product):** `creator-commerce-backend-v2/docs/collaboration/product-docs/`  
**Reference UI (Stitch):** `stitch_remix_of_campaign_page_3005/Brand-collab_UI`, `Creator-collab_UI`  
**Backend API:** `api/v1/collaboration` (see backend `docs/ai-collaboration/2026-06-04-collaboration-module-intake.md`)

---

## Architecture

| Layer | Path |
| --- | --- |
| Feature | `src/features/collaboration/` |
| Brand page | `src/pages/brand/collaborations/` |
| Creator page | `src/pages/creator/collaborations/` |
| Creator dashboard | `src/pages/creator/dashboard/` |
| Contracts / API | `src/features/collaboration/contracts/`, `api/` |

**Shell:** 3-pane desktop (list 25% · chat 45% · execution 30%), mobile 3-step (list → chat → execution).  
**Aurora-first:** port Stitch layout/behavior; do not ship raw Tailwind from reference HTML.

**UCE vs Collaborations:** UCE campaign pipeline (prospects/applicants) stays under Campaigns. After applicant approval, a collaboration thread is auto-created; brand opens **Collaborations** to run the 6-stage chat workflow.

---

## Dev accounts (local seed)

| Role | Email | OTP | Script |
| --- | --- | --- | --- |
| Creator (test) | `test@creator.com` | `123456` | `npm run db:seed:dev-creator` (backend v2) |
| Brand | Your onboarded work email | `123456` | Existing brand onboarding |

**Login:** Single form at `/login` — enter brand or creator email + same stub OTP; role is resolved from the database.

**Dev / staging seed (later):** Re-run the same script against the target DB after tunnel + `DATABASE_URL` (documented in backend `docs/database/README.md`). Do not commit secrets.

---

## Phase tracker

### Phase A — Brand collaborations MVP

| ID | Task | Status |
| --- | --- | --- |
| A1 | Remove legacy AI chat (`features/ai-chat`, route, sidebar) | Done |
| A0 | Unified `/login` (brand + creator email, OTP `123456`) | Done |
| A2 | Brand routes `/brand/collaborations` | Done |
| A3 | `collaboration-client` + contracts | Done |
| A4 | Desktop 3-pane workspace | Done |
| A5 | Mobile 3-step navigation | Done |
| A6 | Thread list + filters (campaign, stage, search) | Done |
| A7 | Chat feed + messages API | Done |
| A8 | Execution hub — Stage 1 negotiation (accept / counter) | Done |
| A9 | Execution hub — Stages 2–3 (securement, logistics) | Done |
| A10 | Execution hub — Stages 4–6 (production, posting, feedback) | Done |
| A11 | About pane (brief/campaign context from thread + UCE) | Partial |
| A12 | Decline / nudge / wallet / PDF agreement | Not started (backend) |
| A13 | Script sub-phase (4.1 / 4.2) | Not started |
| A14 | S3 media upload (presign) | Not started |
| A15 | 72h auto-approval cron UI | Not started |

### Phase B — Creator collaborations

| ID | Task | Status |
| --- | --- | --- |
| B1 | `CREATOR` role in FE types + auth redirect | Done |
| B2 | Creator sidebar: Dashboard + Chat | Done |
| B3 | Creator routes `/creator/dashboard`, `/creator/collaborations` | Done |
| B4 | Creator login via unified `/login` | Done |
| B5 | Creator seed script + profile/bank/shipping | Done (run `npm run db:seed:dev-creator` when DB is up) |
| B6 | Same workspace; creator execution cards (role-aware, all stages) | Done |
| B7 | Creator bank + shipping forms (profile API) | Done |
| B8 | Creator onboarding flow (full) | Not started |

### Approach B — UCE funnel (milestones 1–2)

| ID | Task | Status |
| --- | --- | --- |
| M1a | Creator `GET/POST` open campaigns (`api/v1/creator-uce`) | Done |
| M1b | Creator dashboard apply UI | Done |
| M1c | Brand applicants approve / decline | Done |
| M1d | `workflow_collaboration_id` on pipeline rows + deep link `?thread=` | Done |
| M1e | Active collabs → Open collaboration link | Done |
| M2 | Stage 2–6 execution fidelity vs product docs | Partial (existing hub) |
| WS | WebSocket live updates | Deferred (3s REST poll on open thread; swap hook for WS) |
| M2b | Action idempotency guards + FE validation | Done |
| M2c | Live sync poll (chat + execution hub) | Done |

### Phase C — Fidelity (later)

| ID | Task | Status |
| --- | --- | --- |
| C1 | `GET .../threads/:id/context` enriched brief/deliverables | Not started |
| C2 | Decline / terminate / void collaboration APIs | Not started |
| C3 | Nudge notifications | Not started |
| C4 | Agreement PDF generator | Not started |
| C5 | Double-blind 48h + auto-approval jobs | Not started |
| C6 | Run seed on dev RDS (ops) | Not started |

---

## API mapping (implemented in UI)

| UI action | Method | Path |
| --- | --- | --- |
| List threads | GET | `/collaboration/threads` |
| Thread detail | GET | `/collaboration/threads/:id` |
| Messages | GET | `/collaboration/threads/:id/messages` |
| Send message | POST | `/collaboration/threads/:id/messages` |
| Creator quote | POST | `.../negotiation/quote` |
| Brand counter | POST | `.../negotiation/counter-offer` |
| Accept terms | POST | `.../negotiation/accept` |
| Fund escrow | POST | `.../securement/fund-escrow` |
| Advance receipt | POST | `.../securement/advance-receipt` |
| Confirm manual advance | POST | `.../securement/confirm-manual-advance` |
| Dispatch logistics | POST | `.../logistics/dispatch` |
| Confirm receipt | POST | `.../logistics/confirm-receipt` |
| Report issue | POST | `.../logistics/report-issue` |
| Submit media | POST | `.../production/submit` |
| Review media | POST | `.../production/review` |
| Live URL | POST | `.../posting/live-url` |
| Verify compliance | POST | `.../posting/verify-compliance` |
| Submit review | POST | `.../feedback/review` |
| Bank details | POST | `/collaboration/creator/bank-details` |
| Shipping address | POST | `/collaboration/creator/shipping-address` |

---

## Stitch reference index

| Folder | Purpose |
| --- | --- |
| `collaborations_desktop_workspace` | Empty + active 3-pane shell |
| `collaborations_mobile_workflow` | Mobile steps |
| `collaborations_phase_3_negotiation_securement_hub` | Stages 1–2 cards |
| `collaborations_phase_4_logistics_production_workflow` | Stages 3–4 |
| `collaborations_phase_5_compliance_archival_hub` | Stages 5–6 |
| `collaborations_*_audit_*` | Terminal / compliance locks |

Creator folder mirrors brand; adjust shell copy to **Creator Centre** in UI polish pass.

---

## Intake note

Stitch HTML uses Tailwind + Material Symbols. Intake: `docs/ai-collaboration/2026-06-04-collaboration-frontend-intake.md` (Aurora port, scoped UI).
