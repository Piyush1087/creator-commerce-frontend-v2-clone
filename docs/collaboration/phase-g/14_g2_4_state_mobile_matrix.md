# Collaboration Phase G — G2.4 Cross-Cutting State & Mobile Matrix

**Status:** ACCEPTED  
**Captured:** 2026-08-15  
**Scope:** G2.4 ONLY — cross-cutting state / mobile freeze; no Stitch generation; no runtime redesign implementation  
**Inputs:** `04_g0_2_interaction_recovery_mobile.md`; G1B; `12_g2_2…`; `13_g2_3…`

For each state: what remains visible · copy intent · recovery · primary/secondary actions · desktop · mobile · Stitch variant needed (design-time flag only — Stitch not invoked in G2).

---

## State matrix

| State | Remains visible | Copy intent | Recovery | Actions | Desktop | Mobile | Stitch variant? |
|---|---|---|---|---|---|---|---|
| Initial loading | Shell + pane skeletons/placeholders | Honest loading, not empty | Auto hydrate | None | Pane-local | Same on active step | YES — loading treatment |
| Background refetch | Prior hydrated data | Silent or subtle refreshing; not destructive clear | Auto | Manual Refresh available | Keep panes | Keep step data | YES — subtle refresh |
| Empty Inbox | Inbox pane empty state | No collaborations yet | None / go Campaigns outside | None in Collab | Empty list | Step 1 empty | YES |
| No messages | Chat pane empty-zero | No messages yet (not error) | Send when capable | Composer if capable | Empty feed | Step 2 | YES |
| Command processing | Prior data + busy control | In progress | Wait | Disable duplicate submit | Busy CTA | Same | YES |
| Command failure | Prior data + pane error | Failure without stacks/tokens | Retry / fix input | Retry, dismiss | Pane alert | Alert not covering Back/Refresh | YES |
| Read failure | Prefer failed_with_data | Could not load details | Refresh / Retry | Manual Refresh | Pane | Pane | YES |
| Contract failure | Hub contract failure state | Invalid read / publishingRequired honesty | Refresh; escalate if persistent | Refresh | Hub | Hub | YES |
| Unavailable / no-access | No fake selection | Frozen: headline *Collaboration unavailable*; body *This collaboration may no longer be available or you may not have access.*; recovery *Back to Collaborations* | Back to Collaborations | Back | Chat/selection | Same | YES |
| Realtime degraded | All hydrated panes | Connection degraded; data may be stale until refresh | Manual Refresh; auto reconnect refetch | Manual Refresh | Notice strip | Notice on all steps | YES |
| Realtime restored | Updated after refetch | Notice clears | Auto refetch on reconnect | None | Clear notice | Clear | Optional |
| Compatibility-limited | History/context; bounded execution | Frozen limited-details headline/body | None for missing controls | Only projected actions | Hub bound | Hub bound | YES |
| Action unavailable | Panel without CTA | Capability absent — not a bug toast storm | None | Hidden/disabled CTA | Hub | Hub | YES |
| Paused / read-only | History + hub paused | Messaging closed copy when send absent; hub paused | Wait / external unpause deferred | No send | Composer read-only | Same | YES |
| Cancelled | History + Resolution | Messaging closed; resolution reason | None | View only (+ residual settlement) | Terminal layout | Terminal | YES |
| Terminated | History + Resolution | Messaging closed; termination reason | None | View only | Terminal | Terminal | YES |
| Completed | History + Completion/Feedback | Messaging closed; feedback when capable | Submit feedback | Feedback CTA | Terminal | Terminal | YES |
| Provider unavailable | Settlement/publishing pending honesty | Eligible ≠ paid; provider unavailable | Retry later when adapter/provider exists | No fake pay | Card | Card | YES |
| Settlement deferred | Entitlement projection | Adapter deferred — do not imply paid | None in Collab | None invented | Settlement card | Same | YES |
| Mobile narrow viewport | Stepped IA | Same semantics | Step Back | Full-width CTAs | N/A | Steps 1–3 | YES — mobile workspace |
| Tablet / intermediate | Stepped or refined breakpoint | Must remain operable; no access regression | Same | Same | May step | Step | YES — breakpoint polish |
| Keyboard / composer | Composer above keyboard | Usable send when capable | Dismiss keyboard | Send | N/A critical | Critical | YES |
| Drawer / sheet | MVP counterpart fields | Product copy only | Close | Close | Drawer | Sheet | YES |
| Refresh / re-entry | Restored selection if owned | Deep-link reselect owned thread | Manual Refresh | Refresh | All panes | All steps | Optional |

---

## Mobile-specific freezes

1. Creator bottom nav four slots: Home · Campaigns · Collaborations · Profile.
2. Deep-link opens Chat step when thread owned.
3. Error alerts must not obscure Back / Refresh.
4. Counterpart context uses sheet, not persistent side drawer.
5. Primary capability CTAs are full-width where Aurora mobile contract requires.
6. Realtime degraded notice visible on every step.

---

## Stitch guidance (design-time only — do not invoke Stitch in G2)

- Stitch must design variants marked YES so G3 does not invent functional states.
- Stitch must not invent new recovery actions, lifecycle states, or polling.
- Degraded-realtime is operational UX, not permission to change HTTP authority.

---

## Phase result

```text
Phase: G2.4 Cross-Cutting State & Mobile Matrix
Status: ACCEPTED

Starting frontend SHA: ee589033128ba082d9993f084d4ff592476c51ee
Final frontend SHA:    (docs commit after this package)
Starting backend SHA:  b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5
Final backend SHA:     b7c726c8e7fba114ee7a0c2b09aac7aaae698ec5

Scope completed: Cross-cutting state matrix + mobile treatments + Stitch variant flags
Acceptance gates: Material states represented; no functional state left for Stitch to invent
Product decisions required: None

Documentation file: 14_g2_4_state_mobile_matrix.md

Next phase: AUTO-PROCEED → G2.5
Reason: Exit gate satisfied.
```
