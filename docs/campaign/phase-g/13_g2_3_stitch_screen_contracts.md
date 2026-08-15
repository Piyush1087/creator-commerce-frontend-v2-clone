# G2.3 — Campaign Page Stitch screen contracts

## Contract status

This is the final Product/UX contract for a separate Codex + Stitch worker. It governs six Product-approved design states and preserves accepted G1 authority. It grants no permission to invoke Stitch in this package, change source, merge, or deploy.

## Cross-screen consistency contract

### Campaign header grammar

Every operational desktop screen uses the same persistent shell: Campaign name and lifecycle status first; compact objective/timing/budget context second; one backend-permitted lifecycle action; secondary edit/share utilities visually subordinate. Strategy, targeting, logistics, and commercial details are summaries with progressive disclosure, not permanent page-length blocks.

### Lifecycle and readiness grammar

Lifecycle answers **“what operational state is the Campaign in?”** Readiness answers **“are its current canonical requirements satisfied?”** They are visually adjacent but never merged. A LIVE Campaign that loses readiness remains LIVE; the readiness callout explains missing requirements and backend capabilities determine available actions.

### Workspace navigation grammar

The frontend labels Brand tasks, while backend workspace IDs, visibility, order, availability, counts, and unavailable copy remain authoritative. One workspace is active. Selection persists in the URL, valid selection restores on re-entry, and invalid/unavailable selection falls back to the highest-priority available backend workspace. Unavailable is never presented as an operable empty workspace.

### Setup hierarchy

The dependency order is fixed: explicit Campaign Asset identity → canonical Brief owned by that Asset → deliverables. No Asset is inferred from count, name, URL, type, similarity, or uniqueness. Reconciliation language is Brand-facing and contains no technical legacy/migration terminology.

### Applicants versus Collaborations

Applicants is an Application decision queue. Collaborations is a reference surface for independently owned post-acceptance Collaborations. Acceptance must never visually imply automatic Collaboration creation, and Campaign must not expose Collaboration lifecycle controls.

### Unavailable and deferred treatment

Discovery and Reporting use distinct truthful unavailable treatment when providers cannot supply authority. Unavailable Discovery is not “zero creators”; unavailable Reporting is not “zero performance.” Never show invented recommendations, metrics, freshness, completeness, or finality.

### Terminal/read-only treatment

Terminal canonical and historical compatibility pages carry persistent read-only framing. Operational CTAs, lifecycle controls, canonical readiness claims, and mutation affordances are absent. Canonical records win where present; technical compatibility terminology is not exposed.

### Desktop-to-mobile relationship

CP-ST-07 freezes responsive interaction grammar. Other desktop contracts retain their information order on mobile, use the CP-ST-07 compact header/workspace/AppShell patterns, stack forms and cards, and move secondary utilities to disclosure/menu. No core interaction may depend on a desktop table or page-level horizontal scrolling.

---

## CP-ST-01 — Operational Campaign

1. **Purpose:** Establish the normal Brand workspace and the visual grammar inherited by all operational variants.
2. **Representative scenario:** Canonical LIVE/ACTIVE, ready Campaign; Discovery selected; Discovery and Reporting providers truthfully unavailable; Applications count present.
3. **Dominant Brand goal:** Understand Campaign health and enter the next relevant task workspace.
4. **Viewport:** Desktop.
5. **Page shell:** Persistent AppShell, breadcrumb, compact Campaign header, lifecycle/readiness cluster, workspace navigation. Active workspace and conditional notices are state-specific.
6. **Information hierarchy:** (1) identity + lifecycle + permitted action; (2) readiness and highest-priority exception; (3) workspace navigation and active task; (4) compact Campaign facts; (5) detailed strategy/setup on demand.
7. **Required content:** Campaign name, lifecycle label, objective, timing/date where supplied, budget envelope/spend truth where supplied, readiness label and missing requirements, backend workspaces/order/counts/availability, linked Asset/Brief summaries, active workspace content.
8. **Primary CTA:** The single backend-permitted lifecycle action, or the highest-priority readiness remediation when lifecycle action is unavailable.
9. **Secondary actions:** Edit accepted essentials, share/router, disclose strategy, navigate to Setup/Applicants/Collaborations.
10. **Workspace state:** Discovery selected because it is the highest-priority available backend workspace; unavailable provider message appears inside it.
11. **Readiness:** Ready in the representative; not-ready/post-live readiness loss are governed variants.
12. **Lifecycle:** LIVE/ACTIVE in the representative; backend capabilities control transitions.
13. **Required components/interactions:** AppShell, breadcrumb, Badge, Button, Alert, compact summary Card, disclosure/drawer, backend-ordered workspace switcher, URL-backed selection and deterministic fallback.
14. **Code-only variants governed:** DF-06 primary error/retry; DF-08 lifecycle/status; DF-09 readiness; DF-10 empty collections; DF-11 data/count; DF-12 loading/progress; DF-13 local errors; DF-14 primary loading.
15. **Deferred/unavailable:** Discovery recommendations and Reporting metrics remain explicit unavailable states; no fake cards or zero metrics.
16. **Must preserve from G1:** Canonical Asset/Brief/Application authority; independent Collaboration boundary; backend lifecycle/readiness/capabilities/workspaces; current workspace frontend ownership and URL restoration; canonical wins.
17. **Must not design/invent:** Provider recommendations/metrics, frontend-derived transitions, legacy pipeline controls, inferred Asset identity, automatic Collaboration creation.
18. **Responsive relationship:** CP-ST-07 governs compression, navigation, disclosure, and action priority.
19. **Design-system authority:** Aurora Card, Badge, Alert, Button, Tabs/selection patterns, SideDrawer; AppShell header/breadcrumb/sidebar; Create Campaign terminology and status/step continuity only.

## CP-ST-02 — Setup and reconciliation

1. **Purpose:** Make an unsafe-to-execute Campaign understandable and guide explicit, deterministic setup.
2. **Representative scenario:** Active or Draft Campaign with reconciliation required, no approved Campaign Asset, no canonical Brief.
3. **Dominant Brand goal:** Link the correct Brand Centre Asset, then complete its Brief/deliverables.
4. **Viewport:** Desktop.
5. **Page shell:** Same header/lifecycle grammar; prominent state-specific reconciliation callout and Setup content replace normal operational emphasis.
6. **Information hierarchy:** (1) “Campaign setup needs reconciliation” and safe consequence; (2) explicit Asset selection; (3) linked Asset confirmation; (4) Brief and deliverables; (5) supporting Campaign strategy on demand.
7. **Required content:** Campaign identity/lifecycle, readiness missing requirements, approved Brand-facing guidance, selectable BrandProfile/Offering/BrandOffer labels and types, linked Asset summary, Brief title/requirements, explicit Asset owner selector, deliverable format/quantity/publishing applicability.
8. **Primary CTA:** Link the explicitly selected Brand Centre Asset. After success, primary task may advance to Create Brief.
9. **Secondary actions:** Inspect Brand Centre entity, return to Campaigns, disclose strategy; no execution action while backend disallows it.
10. **Workspace state:** Setup/remediation surface is dominant; backend operational workspace navigation may remain visible only where available and non-misleading.
11. **Readiness:** Reconciliation-required/not-ready with explicit missing requirements.
12. **Lifecycle:** Active/Draft as supplied; readiness does not rewrite lifecycle.
13. **Required components/interactions:** Warning Alert, SelectField with no default inference, explicit Link Button, linked-Asset confirmation Card, staged Brief form, inline loading/error, progressive disclosure.
14. **Code-only variants governed:** Asset choices loading/error; no Asset; linked Asset/no Brief; one/many Assets; Brief empty/populated; create progress/error; ordinary non-reconciliation not-ready setup.
15. **Deferred/unavailable:** Application/Collaboration execution unsupported without truthful canonical authority; Discovery/Reporting provider states remain unchanged.
16. **Must preserve from G1:** Explicit selection; exact Brand ownership; no cross-brand/inactive/duplicate selection; Brief belongs to exact Asset; no invented deliverables or lineage; terminal mutation rejection.
17. **Must not design/invent:** Automatic selection, “recommended” mapping based on inference, legacy/UCE/migration terminology, guessed Brief semantics, backfill controls.
18. **Responsive relationship:** CP-ST-07 shell rules apply; remediation and form controls stack in dependency order with full-width primary action.
19. **Design-system authority:** Aurora Alert, Card, SelectField, TextField, Toggle, Button, Progress; accepted Create Campaign form rhythm and terminology, not its behavior.

## CP-ST-03 — Applicants decision queue

1. **Purpose:** Present canonical Applications as decisions requiring Brand attention.
2. **Representative scenario:** Ready Campaign with one SUBMITTED Application and no Collaboration reference yet.
3. **Dominant Brand goal:** Review the creator/Application context and accept or decline safely.
4. **Viewport:** Desktop.
5. **Page shell:** CP-ST-01 shell persists; Applicants is selected and task content is state-specific.
6. **Information hierarchy:** (1) submitted/action-required count; (2) creator identity and relevant Brief; (3) Application status/context; (4) accept/decline; (5) resolved Applications on demand.
7. **Required content:** Creator name/email fallback, canonical Brief title, Application status, optional independent Collaboration reference, action progress/error.
8. **Primary CTA:** Accept Application where aggregate state permits.
9. **Secondary actions:** Decline, inspect context, view an existing Collaboration reference; resolved records are subordinate.
10. **Workspace state:** Applications selected because the Brand is handling a decision queue; backend count remains authoritative.
11. **Readiness:** Ready representative; workspace may remain visible under other backend-supplied readiness states.
12. **Lifecycle:** Operational state supplied by backend; no Application-derived lifecycle change.
13. **Required components/interactions:** Workspace switcher, decision cards/list, status Badge, paired Buttons with clear hierarchy, busy/disabled state, inline Alert/Retry.
14. **Code-only variants governed:** Empty Applications, one/many, accepted/rejected history, decision progress/error, optional Collaboration reference, capability-disabled action.
15. **Deferred/unavailable:** No prospect/recommendation content is fabricated; Collaboration lifecycle details remain with Collaboration owner.
16. **Must preserve from G1:** Application owns decision state; decisions only on submitted canonical Applications; acceptance does not create Collaboration; legacy pipeline cannot operate.
17. **Must not design/invent:** Collaboration creation confirmation, pipeline stages, inferred creator lineage, commercial or lifecycle values.
18. **Responsive relationship:** CP-ST-07 governs shell and workspace switcher; decision cards become single-column with distinct, reachable actions.
19. **Design-system authority:** Aurora Card, Badge, Button, Alert, loading patterns; AppShell; accepted Campaign vocabulary.

## CP-ST-04 — Collaboration references

1. **Purpose:** Show which independent Collaborations relate to the Campaign without making Campaign their owner.
2. **Representative scenario:** Operational Campaign with one canonical Application referencing an existing independent Collaboration.
3. **Dominant Brand goal:** Identify and navigate to the related Collaboration.
4. **Viewport:** Desktop.
5. **Page shell:** CP-ST-01 shell persists; Collaborations workspace is state-specific.
6. **Information hierarchy:** (1) related Collaboration count; (2) creator identity and clear reference relationship; (3) owner-provided summary if available; (4) navigation to Collaboration.
7. **Required content:** Creator identity, Collaboration reference identifier/label, originating Application relationship where supplied, safe empty copy.
8. **Primary CTA:** Open the independent Collaboration when an accepted route/action exists; otherwise the surface is read-only.
9. **Secondary actions:** Return to Applicants or other Campaign workspace.
10. **Workspace state:** Collaborations selected deliberately; it is not an extension of Applicants.
11. **Readiness:** Operational representative; readiness remains shell context only.
12. **Lifecycle:** Campaign lifecycle remains backend-authored and separate.
13. **Required components/interactions:** Reference list/cards, clear external-domain navigation affordance, empty and local error states.
14. **Code-only variants governed:** No references, one/many references, reference read error, creator label variants.
15. **Deferred/unavailable:** Full Collaboration lifecycle/commercial/deliverable UI is not supplied by Campaign.
16. **Must preserve from G1:** Independent Collaboration wins; optional explicit reference only; no inferred lineage; no legacy pipeline mutation.
17. **Must not design/invent:** Collaboration stages, controls, creation, acceptance side effects, commercial state, inferred references.
18. **Responsive relationship:** CP-ST-07 governs shell/navigation; reference cards stack and retain a clear boundary/navigation cue.
19. **Design-system authority:** Aurora Card, Badge/Alert, Button/link patterns; AppShell routing grammar.

## CP-ST-05 — Terminal / historical Campaign

1. **Purpose:** Preserve understandable Campaign history while making non-operability unmistakable.
2. **Representative scenario:** ARCHIVED legacy-only historical Campaign whose canonical reconstruction is unsafe.
3. **Dominant Brand goal:** Review truthful historical context and understand that no further action is available.
4. **Viewport:** Desktop.
5. **Page shell:** Campaign identity and lifecycle remain; persistent read-only banner and historical summary replace operational controls/workspaces.
6. **Information hierarchy:** (1) terminal/read-only status; (2) Campaign identity and known historical facts; (3) bounded Assets/Briefs/participation presentation where truthful; (4) return navigation; (5) detail on demand.
7. **Required content:** Campaign name, terminal lifecycle, known objective/timing/budget facts, clearly labelled read-only compatibility content, absence/unavailability explanations without fabricated canonical readiness.
8. **Primary CTA:** None operational; safe return to Campaigns is the main navigation action.
9. **Secondary actions:** Inspect historical detail only.
10. **Workspace state:** No operational workspace is selected. Historical sections are read-only projections, not workspace authority.
11. **Readiness:** No fabricated canonical-ready/not-ready claim for unsafe historical reconstruction.
12. **Lifecycle:** COMPLETED or ARCHIVED as authoritative historical state.
13. **Required components/interactions:** Persistent read-only Alert/banner, status Badge, compact summary Cards, disclosures, disabled/absent mutation controls.
14. **Code-only variants governed:** Terminal canonical record; COMPLETED/ARCHIVED labels; canonical-wins historical projection; partial known facts; empty historical sections.
15. **Deferred/unavailable:** Canonical execution, Application/Collaboration lineage, Reporting/Discovery truth not reconstructable remains unavailable.
16. **Must preserve from G1:** Bounded read-only compatibility; canonical wins; no destructive retirement; no inference; no operational actions.
17. **Must not design/invent:** Reconciliation CTA for terminal records, lifecycle toggle, Asset/Brief mutation, pipeline actions, readiness, metrics, technical legacy terminology.
18. **Responsive relationship:** CP-ST-07 supplies compact shell and AppShell; content stacks as a read-only record with no horizontal dependency.
19. **Design-system authority:** Aurora Alert, Badge, Card, disclosure and link patterns; AppShell.

## CP-ST-07 — Mobile operational Campaign

1. **Purpose:** Freeze the minimum 390×844 composition needed to operate the accepted Campaign Page without losing authority or actions.
2. **Representative scenario:** LIVE/ready Campaign; Applications available; Reporting unavailable; user switches workspaces and returns.
3. **Dominant Brand goal:** Check status/readiness and complete the current workspace task with one hand and no clipped controls.
4. **Viewport:** 390×844 mobile.
5. **Page shell:** Compact AppShell header/menu and bottom navigation persist; Campaign identity/status/action, readiness, compact facts, and workspace switcher appear in that order. Only one workspace body renders.
6. **Information hierarchy:** (1) Campaign name + lifecycle + one primary action; (2) readiness/exception; (3) workspace switcher; (4) selected workspace task; (5) compact facts/setup summaries; (6) deeper detail in drawer/disclosure.
7. **Required content:** Same authoritative fields as CP-ST-01, readable workspace labels/counts/availability, selected state, lifecycle control where capable, truthful unavailable copy, accessible AppShell navigation.
8. **Primary CTA:** Current backend-permitted lifecycle or readiness action; inside Applicants, the current decision action becomes contextual primary.
9. **Secondary actions:** Menu/drawer utilities, workspace changes, strategy/setup disclosure, safe back navigation.
10. **Workspace state:** Applications selected in the representative; URL persists it. Re-entry restores it; invalid/unavailable Reporting request falls back to backend-priority Discovery.
11. **Readiness:** Ready representative; warning callout variant retains top priority when not-ready.
12. **Lifecycle:** LIVE representative; one accessible backend-capability control.
13. **Required components/interactions:** Mobile AppShell menu/bottom nav, compact header, Badge, Button, Alert, scrollable or compact workspace control without page overflow, single-column cards, drawer/disclosure, minimum touch targets, visible focus.
14. **Code-only variants governed:** Responsive forms/empty/local errors for CP-ST-01–05; workspace persistence/fallback; lifecycle/readiness variants; primary Retry derived from shell/Aurora.
15. **Deferred/unavailable:** Discovery/Reporting remain explicit unavailable states and cannot be collapsed into zero counts.
16. **Must preserve from G1:** Same backend projection/capability authority; URL-backed workspace ownership; explicit Asset selection; Application/Collaboration distinction; terminal safeguards.
17. **Must not design/invent:** Mobile-only authority, swipe-only essential actions, hidden readiness, desktop-table requirement, provider content, inferred actions.
18. **Responsive relationship:** This screen is the governing responsive grammar for all desktop contracts; it is not a separate product model.
19. **Design-system authority:** Aurora responsive Cards, Alerts, Buttons, fields, Tabs/selection, SideDrawer; AppShell MobileShellNav/MobileBottomNav; accepted Create Campaign mobile rhythm and terminology only.

## STITCH WORKER INPUT MANIFEST

### A. Product authority

- `docs/campaign/phase-g/11_g2_1_campaign_workspace_authority_matrix.md`
- `docs/campaign/phase-g/12_g2_2_ui_state_inventory_and_stitch_selection.md`
- `docs/campaign/phase-g/13_g2_3_stitch_screen_contracts.md`
- `docs/campaign/phase-g/04_g0_3_authority_freeze.md`
- `docs/campaign/phase-g/05_g1a_canonical_asset_reconciliation.md`
- `docs/campaign/phase-g/06_g1b_canonical_brief_deliverable.md`
- `docs/campaign/phase-g/07_g1c_discovery_applicants_collaboration_cutover.md`
- `docs/campaign/phase-g/08_g1d_lifecycle_readiness_workspace_reporting.md`
- `docs/campaign/phase-g/09_g1e_state_compatibility_validation_closure.md`
- `docs/campaign/phase-g/10_consolidated_g1_functional_acceptance.md`

### B. Design authority

- Canonical `dummy_tcs` checkout at `3bc6457f99b24e1ef5767e5c80136f9b4c55f861`, especially Campaign/Page and design-system documentation selected by the future worker.
- `docs/design-system/README.md`
- `docs/design-system/component-map.md`
- `src/design-system/aurora/` including `tokens.css`, `components.css`, and exported primitives.
- `src/layouts/app-shell/AppShell.tsx`, `AppHeader.tsx`, `AppSidebar.tsx`, `MobileShellNav.tsx`, `MobileBottomNav.tsx`, and `app-shell.css`.
- Accepted Create Campaign UI only for terminology, lifecycle vocabulary, Aurora patterns, and visual continuity; its behavior is excluded.

### C. Frontend implementation authority

- Repository: `Piyush1087/creator-commerce-frontend-v2-clone`.
- Branch/ref: `phase-g/campaign-page-g0-audit`.
- Final accepted functional source SHA: `e00f383b4bfb1181a42d31f16e26ce23e5797006`.
- `src/pages/brand/uce/BrandUceCampaignDetailPage.tsx` and CSS.
- `src/features/uce/components/CampaignWorkspaceZone1.tsx` and CSS.
- `CampaignReadinessWorkspaceCard.tsx`, `CampaignParticipationCard.tsx`, `CampaignAssetReconciliationCard.tsx`, `CanonicalCampaignBriefsCard.tsx`.
- `CampaignProductsBriefsRepository.tsx`, accepted drawers/modals, `uce-responsive.css`.
- `src/features/uce/contracts/brand-uce.contracts.ts`, API client, mapper, and focused G1 tests.

### D. Backend read-only contract authority

- Repository: `Piyush1087/creator-commerce-backend-v2-clone`.
- Branch/ref: `phase-g/g1a-canonical-asset`.
- Final accepted backend SHA: `0f2c6c7b659d7305d36bd2ee0775973494d5a95e`.
- `src/features/brand-uce/brand-uce.controller.ts`.
- `dto/brand-uce-campaign.dto.ts`, `dto/brand-uce-campaign-asset.dto.ts`, `dto/canonical-campaign-brief.dto.ts`.
- `services/brand-uce-campaign.service.ts`, `brand-uce-campaign-asset.service.ts`, `canonical-campaign-brief.service.ts`, `campaign-application.service.ts`, `brand-uce-pipeline.service.ts`, `brand-uce-reporting.service.ts`.
- Prisma canonical Campaign Asset, Brief/Deliverable, Application, and independent Collaboration models/migrations as read-only contract evidence.

### E. Explicit exclusions and deferred owners

- No Create Campaign behavior changes or regression rerun absent concrete integration evidence.
- No new Campaign/Asset/Brief/Application/Collaboration/lifecycle/readiness/workspace semantics.
- No legacy Product, Brief, pipeline, or Reporting authority; no destructive migration/backfill.
- Discovery populated design is deferred to its acquisition/recommendation owner.
- Reporting populated design is deferred to Reporting/Performance owner.
- Collaboration lifecycle/commercial UI remains with independent Collaboration.
- No production/staging population inference; `DEPLOYED_DATA_EVIDENCE_REQUIRED` remains migration debt.
- No merge, deployment, or backend mutation is implied by this manifest.

The manifest is complete enough to author a separate cross-chat handoff prompt after final Product approval. That handoff prompt is intentionally not created here.
