# Collaboration Phase G — G2.2 Workspace Information Architecture Freeze

**Status:** ACCEPTED  
**Captured:** 2026-08-15  
**Scope:** G2.2 ONLY — IA / hierarchy freeze; no Stitch; no runtime redesign implementation  
**Inputs:** `11_g2_1_surface_ownership_freeze.md`; G0.3; G1 consolidated acceptance; visual observation pack  
**Constraint:** Do not invent new lifecycle stages.

---

## 1. Page / header hierarchy

```text
App shell
└─ Collaboration route (/brand|creator/collaborations)
   └─ Collaboration Workspace
      ├─ Workspace chrome (title, Manual Refresh, realtime degraded notice)
      ├─ Inbox pane / step
      ├─ Chat pane / step  (header + messages + composer | read-only)
      └─ Execution hub pane / step  (stage nav + active submodule + terminal cards)
```

Header on selected thread shows counterpart + Campaign/Asset/Brief shorthand and opens counterpart drawer/sheet. Detailed commercial/execution stays in Execution Hub.

---

## 2. Inbox vs active Collaboration

| Rule | Freeze |
|---|---|
| Inbox | Always lists owned Collaborations; terminal rows remain listed |
| Selection | One active thread; deep-link `?thread=` selects owned id only |
| Unavailable deep-link | Frozen unavailable copy + Back to Collaborations; do not auto-select another owned row |
| Empty inbox | Distinct empty state; no fake thread |
| Relationship | Inbox selects; Chat + Hub consume selected detail |

---

## 3. Chat vs Execution prominence

| Viewport | Freeze |
|---|---|
| Desktop (≥1024) | Three panes peer: Inbox \| Chat \| Execution. Chat and Execution share equal workspace weight; Chat is conversation authority; Execution is command authority |
| Mobile / stepped | Ordered steps: Inbox → Chat → Execution. Deep-link lands on Chat step with Hub reachable as next step |
| Terminal | Chat remains for history (read-only composer); Execution shows Resolution / residual Settlement / Completion / Feedback as projected |

Do not bury Cancel / primary capability CTAs behind chat-only chrome when capability is projected on Hub.

---

## 4. Progress / stage navigation

- Execution Hub presents five-stage progress from backend projection (Negotiation → Securement → Fulfillment → Production → Publishing) without inventing stages.
- Active stage panel is the primary CTA surface for that stage’s capabilities.
- Later stages may be visible as locked/read-only when projection says so; FE must not unlock early.
- Compliance appears as publishing-adjacent correction path, not a sixth lifecycle stage.
- Resolution / Settlement / Completion / Feedback are terminal/post-path surfaces, not inserted as mid-lifecycle stages.

---

## 5. Campaign / Asset / Brief context placement

| Placement | Content |
|---|---|
| Inbox row | Counterpart + Campaign + Asset + Brief labels from list projection |
| Chat header | Same shorthand; opens counterpart drawer |
| Counterpart drawer | MVP fields only (G2.1) |
| Execution Hub | Commercial + securement + deliverable detail — not duplicated as Intelligence |

Campaign Applications pipeline UI remains outside Collaboration workspace.

---

## 6. Counterpart context pattern

- Pattern: drawer (desktop) / sheet (mobile) invoked from header/counterpart control.
- Read-only; no mutation.
- Loading/empty/error use Product copy; never technical endpoint language.
- Still available on terminal Collaborations for MVP fields.

---

## 7. Active vs terminal layout

| Mode | Inbox | Chat | Execution |
|---|---|---|---|
| ACTIVE | Selectable | History + capability-gated composer | Active stage panel + capabilities |
| PAUSED | Selectable | History + closed messaging copy | Read-only / paused hub treatment |
| CANCELLED / TERMINATED | Selectable | History + closed messaging | Resolution primary; residual settlement if projected |
| COMPLETED | Selectable | History + closed messaging | Completion + Feedback when capable |

---

## 8. Brand vs Creator differences

| Dimension | Brand | Creator |
|---|---|---|
| Route | `/brand/collaborations` | `/creator/collaborations` |
| Counterpart drawer | Creator MVP fields | Brand MVP fields |
| Negotiation CTAs | Accept / counter / decline when capable | Respond per projected actions |
| Securement | Fund / confirm when capable | Bank via Settings link; Cancel when capable |
| Mobile shell entry | Existing Brand shell Collaborations access | Bottom nav Collaborations slot required |

---

## 9. Desktop 3-pane / alternate layout

```text
DESKTOP (≥1024)
┌──────────────┬────────────────────┬─────────────────────────┐
│ Inbox        │ Chat               │ Execution Hub           │
│ list/search  │ header/counterpart │ stage progress          │
│              │ message history    │ active submodule panel  │
│              │ composer|read-only │ secondary cards         │
└──────────────┴────────────────────┴─────────────────────────┘
+ workspace notice strip (realtime degraded) when needed
+ Manual Refresh always reachable
```

Narrow/tablet may use stepped mobile IA (accepted as functionally operable); G2 visual polish may refine breakpoints but must preserve step order and access.

---

## 10. Mobile step navigation

```text
MOBILE STEPS
1) Inbox
2) Chat  ← deep-link default when thread present
3) Execution

Creator bottom nav: Home · Campaigns · Collaborations · Profile
Back controls must not be obscured by error alerts.
Drawers → sheets for counterpart context.
Primary CTAs full-width where Aurora contract requires.
```

---

## 11. Textual wireframes (summary)

**Desktop active Negotiation:** Inbox row selected · Chat with composer · Hub on Negotiation with Brand accept/counter/decline or Creator wait/respond · counterpart drawer optional overlay.

**Desktop Securement:** Same shell · Hub on Securement (Fund / Settings bank link / Creator Cancel if capable).

**Desktop CANCELLED:** Same shell · Chat read-only closed copy · Hub Resolution + financial resolution summary.

**Mobile:** Step chips/back stack Inbox→Chat→Execution; bottom nav Collaborations entry; sheet counterpart.

---

## 12. Phase result

```text
Phase: G2.2 Workspace Information Architecture Freeze
Status: ACCEPTED

Starting frontend SHA: ee589033128ba082d9993f084d4ff592476c51ee
Final frontend SHA:    (docs commit after this package)
Starting backend SHA:  b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5
Final backend SHA:     b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5

Scope completed: Workspace hierarchy, desktop/mobile IA, Chat vs Execution prominence, stage nav, Brand/Creator deltas
Acceptance gates: Information hierarchy complete; major surfaces placed; mobile navigation defined; no unresolved Product decision; no new lifecycle stages invented
Tests: N/A (docs-only)
Product decisions required: None
Deferred owners: unchanged carry
Debt carried: visual density into G2.3–G2.5

Documentation file: 12_g2_2_workspace_ia_freeze.md

Next phase: AUTO-PROCEED → G2.3
Reason: Exit gate satisfied.
```
