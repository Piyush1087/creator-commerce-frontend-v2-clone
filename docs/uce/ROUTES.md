# UCE Routes & Verification Guide

Use these routes to verify the ported pages and their various interactive states.

## 1. Campaign List Dashboard
**Route:** `/brand/uce/campaigns`

### Interactive States to Check:
- **Tab 1: Campaigns (Operations)**: View the primary campaign grid and status toggles.
- **Tab 2: Spend Report (Financials)**: View the burn allocation donut chart, logistics metrics, and audience distribution.
- **Quick Draft Placeholder**: Click the "PlusCircle" icon at the bottom for the conceptual entry point.

---

## 2. Create Campaign Wizard
**Route:** `/brand/uce/campaigns/create`

### Interactive States to Check:
- **Step 1: Strategy**: Fill metadata and select platform formats.
- **Step 2: Targeting**: Check industry selection and the modern Tier Card selection UI.
- **Step 3: Commercials**: Set budget and payout schedules.
- **Live Context Ledger**: Observe the sidebar updates in real-time as you progress.

---

## 3. Campaign Detail Page
**Route:** `/brand/uce/campaigns/:id` (e.g., `/brand/uce/campaigns/CAM-001`)

### Interactive States to Check:

#### A. Prospects Tab
- **State 1 (Initial)**: View the standard creator grid.
- **State 2 (Filtered)**: Click "Filters" to see the selected badge count.
- **State 3 (AI Discovery)**: Click "AI Discovery" to trigger the deep talent search animation state.

#### B. Applicants Tab
- **State 1 (List)**: View the modern data grid with match scores.
- **State 2 (Deep Insights)**: Click **"View Insights"** or any row to enter the detailed AI analysis view (Sticky profile, visual archetypes).

#### C. Active Collabs Tab
- **State 1 (List)**: High-level cards showing collaboration phases.
- **State 2 (Operational Matrix)**: Click **"Operational Matrix"** or **"Manage"** to view the high-density 6-milestone tracking grid.

#### D. Reporting Tab
- **Dashboard State**: View reach, engagement, and conversion trends with the SVG performance curve.

---

## 4. Feature Modals (Accessible from Detail Page)
- **Add Product Drawer/Modal**: Click "Add Product" in the detail header.
- **Add Brief Wizard**: Click "Add Brief" to open the 3-step brief generation flow.
