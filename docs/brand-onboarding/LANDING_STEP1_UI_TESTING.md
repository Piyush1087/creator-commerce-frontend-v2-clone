# Step 1 (Landing URL Capture) — manual UI testing

**Scope:** Landing page URL input (`/` and `/brand/onboarding/landing`) + scan overlay + Step-1 intercept states  
**Frontend:** `creator-commerce-frontend-v2`  
**Backend:** `creator-commerce-backend-v2`  
**Last updated:** 2026-07-10

---

## What this doc covers

This checklist validates the **user-facing UI states** described in the product change doc:

- Backend product doc: `creator-commerce-backend-v2/docs/brand-onboarding/product-team-docs/Change Doc/Landing Page/Landing Page - Change Doc.md`
- Engineering gate spec: `creator-commerce-backend-v2/docs/brand-onboarding/STEP1_GATE_V2_1.md`
- Visual reference HTML: `D:/Work/cursor-repos/landing-scan-page/*/code.html`

**Wired now**

- `POST /api/v1/discovery/resolve` + `validate` for all gate outcomes
- `POST /api/v1/discovery/waitlist` from the regret/waitlist email panel
- `discovery_leads` cache columns (`temporary_payload`, `expires_at`, `signup_completed`, `classification_evidence`)

**Still stubbed (later)**

- Neika quote + Invuet AI pipeline (placeholder JSON in `temporary_payload`)
- Org-claimed “request invite” (UI only; logs to console)
- Phase-0 skeleton timing variants

---

## Prerequisites

1. **Database migration applied** (backend repo):

   ```bash
   cd creator-commerce-backend-v2
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Backend env** (`.env`):

   | Variable | Local UI work | Test rate limits locally |
   |----------|---------------|---------------------------|
   | `STAGE` | `local` | `local` or `dev` |
   | `BRAND_SCAN_LIMITS_ENABLED` | `false` or unset | `true` |

   When `BRAND_SCAN_LIMITS_ENABLED` is **unset**: local (`STAGE=local`) keeps scan counters **off**; SST dev/prod default **on**.

3. **Frontend** — `VITE_API_URL` points at backend (e.g. `http://localhost:3000`).

4. Clear browser session storage if resume/gate state looks stale.

---

## Quick routing overview

```text
User submits URL
  → POST /api/v1/discovery/resolve   (cheap route/gate)
  → POST /api/v1/discovery/validate  (persists lead + industry triage)
  → if success: show preview/setup → navigate /brand/onboarding/scan
  → if waitlist: email panel → POST /api/v1/discovery/waitlist
  → if gate: show Step-1 intercept UI state
```

---

## Scenario checklist

### 1) Happy path (supported industry → scan overlay)

- **Action:** submit a valid brand domain (not already verified/claimed)
- **Expected UI**
  - URL row shows “listening” helper copy while checking
  - After validation, preview/setup modal appears
  - Confirm → navigates to scan overlay (`/brand/onboarding/scan`)
- **Expected scan overlay**
  - **Desktop:** 30% left glass panel (title + step list + Aurora AI card) / 70% canvas with DNA orb, pulse halos, floating chips, trust pill
  - **Mobile:** centered “SCANNING IN PROGRESS” + brand name, concentric ring orb, mono tags, stepper, fixed “AI CAN MAKE MISTAKES” footer
  - Steps advance from `GET /surface-scan/progress` polling (synced to backend phases)
  - On completion: redirects to Brand DNA
- **DB check:** `discovery_leads` row with `is_supported=true`, `expires_at` ~7d out, `temporary_payload` stub JSON

---

### 2) URL syntax error (shake + inline error)

- **Action:** submit an invalid URL (e.g. `not a url`)
- **Expected UI**
  - URL card shakes
  - Inline error under input (no boxed alert)
  - Input remains editable

---

### 3) Security / blocklist locked state (input disabled)

**Frontend schema**

- Social: `instagram.com`, `tiktok.com`
- Marketplace: `amazon.in`
- Restricted segment: `agency.gov`, `school.edu`, `defense.mil`

**Backend gate**

- Private hosts: `localhost`, `192.168.0.10`
- Suspicious TLD: `example.zip`

- **Action:** submit one blocked example
- **Expected UI**
  - Input disabled/locked
  - CTA **Scan Restricted**
  - Inline warning/error (not modal)
  - `.gov` / `.edu` / `.mil` use restricted-segment copy

---

### 4) Infrastructure error state (retry CTA)

- **Action:** stop backend briefly, or use a domain that causes validate to fail
- **Expected UI**
  - Inline warning copy
  - CTA **Retry Connection Check**
  - Retry re-attempts resolve/validate

---

### 5) Cached recovery (resume scan results)

- **Action:** submit a domain with a recent `SURFACE_COMPLETE` unverified profile (<7d)
- **Expected UI**
  - CTA **Resume Previous Scan Results**
  - Green border + helper with pulse dot
  - Continue routes to Brand DNA with cached mode

---

### 6) Rate limit intercept (verification required)

**Enable limits locally**

```env
STAGE=local
BRAND_SCAN_LIMITS_ENABLED=true
```

Restart backend after changing env.

- **Action:** run 6 vendor surface scans for the same domain within 7 days (see `MANUAL_TESTING_STEP1_GATE.md`)
- **Expected UI**
  - Pink input styling, red helper text
  - CTA **Verify Domain Ownership**
  - Routes to `/brand/onboarding/verification`

**Disable limits for free local scanning**

```env
BRAND_SCAN_LIMITS_ENABLED=false
```

---

### 7) Industry regret (unsupported vertical → waitlist)

Backend stub: hostname containing `regret.` (see `discovery-industry.stub.ts`).

- **Action:** `https://regret.example.com`
- **Expected UI**
  - Amber waitlist styling on URL row
  - Email capture panel with industry alert
  - **Join Waitlist** calls `POST /api/v1/discovery/waitlist`
  - Success: “Thanks — you're on the waitlist.”
- **DB check**
  - `discovery_leads`: `is_supported=false`, `status=REJECTED`, stub `temporary_payload`
  - `waitlist_leads`: row linked via `discovery_lead_id` / `market_intelligence_log_id`

---

### 8) Claimed brand protection (org_claimed → request access)

- **Action:** trigger backend `outcome: org_claimed`
- **Expected UI**
  - CTA **Domain Claimed** (disabled)
  - White elevated email panel
  - Submit still **console only** (`landing_email_capture`) — invite API not built yet

---

### 9) Brand active (brand_active → sign in)

- **Action:** trigger `outcome: brand_active` for a verified profile
- **Expected UI**
  - CTA **Sign in** → `/login`

---

## Autofill / focus styling

- URL field uses `autoComplete="off"`
- Chrome autofill should not show blue background (webkit autofill overrides in `brand-onboarding.css`)

---

## Quick API smoke (optional)

```bash
# Waitlist path
curl -s -X POST http://localhost:3000/api/v1/discovery/validate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://regret.example.com"}'

# Then POST /api/v1/discovery/waitlist with email, industry, leadId, logId from response
```

---

## Related docs

- Backend gate testing: `creator-commerce-backend-v2/docs/brand-onboarding/MANUAL_TESTING_STEP1_GATE.md`
- Rate limit config: `creator-commerce-backend-v2/docs/brand-onboarding/STEP1_GATE_V2_1.md`
