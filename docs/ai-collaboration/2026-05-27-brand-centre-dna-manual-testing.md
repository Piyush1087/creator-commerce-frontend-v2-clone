# Brand Centre Tab 1 (Brand DNA) — manual E2E testing

**Scope:** Onboarding → login → Brand Centre DNA tab (read-only fetch)  
**Last updated:** 2026-05-27  
**Frontend:** `creator-commerce-frontend-v2`  
**Backend:** `creator-commerce-backend-v2`

---

## Prerequisites

| Item | Notes |
| --- | --- |
| Backend running | `npm run dev` on port 3000 (or `VITE_API_URL`) |
| Frontend running | `npm run dev` with `VITE_API_URL` pointing at backend |
| Database | Migrations applied; local Postgres reachable |
| Env keys (deep scan) | `GEMINI_API_KEY`, `PARALLEL_API_KEY` for Event 2 worker |
| Stub login OTP | Same as onboarding verification stub (see `STUB_OTP_CODE` in frontend) |

---

## Flow overview

```text
Onboarding Step 1 (domain)
  → Surface scan (Event 1: cold-start budget + offerings)
Onboarding Steps 2–5 (profile, industry, etc.)
Onboarding Step 6 (email verify)
  → Event 2: DEEP_SCAN job enqueued
Login (/login)
  → GET /api/v1/auth/me (session refresh)
Brand Centre (/brand-centre) Tab 1
  → GET /dna, /dna/budget, /dna/account, /scan-status
```

---

## Step-by-step manual test

### 1. Complete onboarding (creates brand profile)

1. Open frontend onboarding entry (`/`).
2. Submit a **new** brand domain (not already registered).
3. Wait for surface scan to finish (Step 1 gate passes).

**Expected backend (Event 1):**

| Data | Source | Where stored |
| --- | --- | --- |
| Brand name, domain, logo | Surface scan / discovery | `BrandProfile` |
| Country → currency | Onboarding Step 2 | `countryCode`, `currencyCode` |
| Industry routing | Industry vertical map | `brandRoutingType` |
| Cold-start budget + pie mixes | Routing template (no Gemini) | `BrandBudgetConfiguration` phase `PHASE_1_COLD_START` |
| Surface offerings / competitors | Surface scan runner | `Offering`, `Competitor` |
| Scan status | After surface scan | `SURFACE_COMPLETE` or `PENDING` |

4. Continue through onboarding until **email verification** (Step 6).
5. Verify OTP for work email.

**Expected after verify (Event 2):**

| Data | Source |
| --- | --- |
| `isVerified = true` | Verification service |
| `scanStatus = DEEP_SCAN_IN_PROGRESS` | Scan service enqueue |
| `BrandCentreJob` type `DEEP_SCAN` status `QUEUED` → `RUNNING` | Job dispatcher |
| When worker completes | Tab 1 DNA fields, personas, budget phase 2, baseline (Tab 2 seed) |

6. Complete registration / trial step if shown (creates `User` + `Organization`, links `BrandProfile.organizationId`).

---

### 2. Sign in

1. Go to `/login`.
2. Enter verified **work email** + stub OTP.
3. Should redirect to `/brand-centre`.

**Auth checks:**

| Request | Purpose | Expected body (top-level only) |
| --- | --- | --- |
| `POST /api/v1/auth/login` | Token + initial user | `accessToken`, `user: { id, email, name, role, organizationId }` |
| `GET /api/v1/auth/me` | Session refresh after login / app shell mount | Same `user` fields only — **no** brand DNA on `/me` |

Brand DNA is **not** on `/me`; it is loaded only on Brand Centre page fetches.

---

### 3. Brand Centre — Tab 1 (Brand DNA)

Open `/brand-centre` (default tab: Brand DNA).

**Network calls (all require `Authorization: Bearer`):**

| Method | Path | UI section |
| --- | --- | --- |
| GET | `/api/v1/brand-centre/scan-status` | Deep scan banner |
| GET | `/api/v1/brand-centre/dna` | Brand DNA card |
| GET | `/api/v1/brand-centre/dna/budget` | Budget card |
| GET | `/api/v1/brand-centre/dna/account` | Account card |

**Deep scan banner (temporary):**

- Shown when `scanStatus === DEEP_SCAN_IN_PROGRESS` or job `QUEUED` / `RUNNING`.
- Polls scan status every ~8s; refetches DNA when scan completes.
- Remove this UI once product no longer needs it.

---

## What you should see — by lifecycle stage

### A. After surface scan only (before email verify)

User may not reach Brand Centre without login; if testing API directly with a token:

| Field | Expected |
| --- | --- |
| Brand name | From surface scan |
| Website | `https://{domain}` |
| Market setup | `{countryCode} / {currencyCode}` or `-` |
| Industry | Onboarding industry chain or `-` |
| Lifecycle stage | Default `GROWTH_STAGE` (formatted) |
| Narrative tagline / description | `-` until deep scan |
| Colors / fonts / tone / personas | Deep scan Prompt 1 → `strategicDna`, `BrandAudiencePersona` |
| Offerings selling points | Deep scan → updates `Offering.sellingPoints`, `isDeepScanned` |
| Offers ledger | Deep scan → `BrandOffer` rows (if returned in Prompt 1) |
| Growth impact matrix | Deep scan → `BrandIntelligenceBaseline.growthImpactMatrix` (AI, not hardcoded) |
| Monthly budget | Cold-start amount from template (INR/USD) |
| Budget mixes | Phase 1 template percents (sum 100 each) |
| Utilization | `0` / `-` |
| Account escrow / Meta | Placeholder strings from `/dna/account` |

### B. During deep scan (`DEEP_SCAN_IN_PROGRESS`)

| UI | Expected |
| --- | --- |
| Yellow Aurora alert + spinner | Visible at top of DNA tab |
| Many DNA fields | Still `-` until worker finishes |
| Budget | Likely still Phase 1 cold-start until worker upgrades |

### C. After deep scan completes (`scanStatus = READY`)

| Field | Expected source |
| --- | --- |
| Tagline, description | Prompt 1 → `BrandProfile` + `strategicDna.narrative` |
| Tone tags | `strategicDna.narrative.toneOfVoice` |
| Colors, fonts | `strategicDna.visuals` |
| Personas | `BrandAudiencePersona` rows |
| Monthly budget | Prompt 1 `masterMonthlyBudget`, phase `PHASE_2_SELF_HEALING` |
| Asset / tier / objective mixes | Prompt 1 strategy mixes |
| Banner | Hidden |

### D. Missing data (any stage)

**Current frontend behaviour (temporary):** show `-` for absent values.  
**Future:** hide fields entirely when empty (per product docs).

---

## Field mapping reference (API → UI)

| UI label | API source |
| --- | --- |
| Brand name | `GET /dna` → `profile.brandName` |
| Website | `profile.websiteUrl` (host shown) |
| Logo | `profile.logoUrl` or initial letter |
| Market setup | `profile.countryCode` + `profile.currencyCode` |
| Industry | `profile.industry` › `subIndustry` › `industryNiche` |
| Lifecycle stage | `profile.lifecycleStage` |
| Narrative title | `narrative.tagline` |
| Narrative body | `narrative.briefDescription` |
| Tone tags | `narrative.toneOfVoice[]` |
| Color swatches | `identity.palette[]` |
| Fonts | `identity.fonts[]` |
| Personas | `personas[].personaName` |
| Monthly budget | `GET /dna/budget` → `masterMonthlyBudget` + currency |
| Utilized | `utilizedBooked + utilizedSpent` |
| Donut charts | `assetMix`, `tierMix`, `objectiveMix` |
| Escrow / Meta / Plan | `GET /dna/account` placeholders |

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| 403 on Brand Centre APIs | User `role` must be `BRAND`; JWT must include `organizationId` linked to `BrandProfile` |
| 404 Brand profile | Complete registration so `BrandProfile.organizationId` matches user org |
| All fields `-` after long wait | Deep scan job failed — `GET /scan-status` → `job.errorMessage`; retry `POST /scan/retry` (dev) |
| Budget 404 | Cold start not seeded — re-run surface scan path or check `BrandBudgetConfiguration` row |
| CORS / network errors | `VITE_API_URL` matches backend origin |

---

## Out of scope for this test pass

- Tab 2 Intelligence & Tab 3 Planner (UI: “Coming soon.”)
- Edit / PATCH flows on DNA tab (buttons are visual only)
- Conditional hide-empty-fields (planned later)
- Live escrow, Meta, team integrations

---

## Quick API smoke (optional)

With a valid brand JWT:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/auth/me
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/brand-centre/scan-status
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/brand-centre/dna
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/brand-centre/dna/budget
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/brand-centre/dna/account
```
