# G2.1 — Corrected Campaign Page IA / authority matrix

## Status and controlling authority

This replaces the former G2.1 matrix. `11A_campaign_page_authority_reconciliation.md`, amended through G1D and G1E, controls any conflict. It is Product/UX authority only; it authorizes neither implementation, data migration, provider integration, nor Stitch invocation.

The Brand mental model is: **understand the Campaign, understand performance and what needs attention, then work in the relevant operational workspace.**

## Canonical composition

```text
Campaign Header
Campaign Attention Layer
Operational workspaces: Discovery | Applicants | Collaborations
```

Reporting is Intelligence-owned Campaign performance, not a workspace. Product/Campaign Asset and Brief setup are Campaign configuration, not workspaces. The selector has exactly three identities: Discovery, Applicants, and Collaborations.

## Authority matrix

| Surface | Brand question | Authority / content | Required behavior |
|---|---|---|---|
| Campaign Header | What Campaign is this, and what can I do? | Identity, lifecycle, capabilities, core facts, Product/Brief summary | Name, lifecycle, backend-permitted action, compact facts and expandable Product/Brief hierarchy. No frontend lifecycle inference. |
| Campaign Summary | What are we trying to achieve? | Authoritative Campaign summary only | Concise summary when supplied; otherwise truthful unavailable state. AI generation is deferred-owner content. |
| Attention: Performance | Is performance available? | Intelligence/Reporting projection | Summary card and `View Full Report` trigger when authoritative. Unavailable is explicit, never zero metrics. |
| Attention: Budget | What is the budget position? | Total plus authoritative committed creator compensation | Show total, committed, and remaining only when authoritative; never guess remaining. |
| Attention: Actionables | What requires attention? | Deterministic or Intelligence projection | Thin prioritized projection, not a Campaign task aggregate. |
| Readiness | Can the Campaign operate? | Backend readiness, reconciliation, capabilities | Distinct from lifecycle. Not-ready suppresses operability; LIVE does not imply readiness. |
| Discovery | Where can I find creators? | Separate recommendation provider | Operational workspace. Provider-unavailable differs from empty; no fabricated recommendations. |
| Applicants | Which applications need a decision? | Canonical Application aggregate | Operational decision queue. Acceptance does not create Collaboration. |
| Collaborations | What relates to this Campaign? | Independent Collaboration references | Operational reference/navigation surface only; Campaign does not control lifecycle. |
| View Campaign drawer | What deeper context can I inspect? | Existing authoritative Campaign projection | Progressive detail, not a fourth workspace. |
| Terminal record | What historical context is safe? | Canonical or bounded compatibility projection | Read-only; no workspace, readiness claim, lifecycle action, or inferred facts. |

## Workspace selection and responsive contract

- Canonical URL values are `discovery`, `applicants`, and `collaborations`.
- Missing, invalid, unavailable, `reporting`, and legacy `applications` values fall back deterministically to a valid canonical workspace.
- Priority and operability are backend/read-projection authority; Reporting never changes workspace count or identity.
- Desktop uses a vertical selector. Mobile uses the same three choices in a compact reachable control with one active body, no page-level horizontal overflow, and drawers/disclosure for deeper detail.

## Prohibited interpretations

- Reporting, Setup, or Product/Brief is not a workspace.
- `Applications` is not the final Brand label or canonical URL identity.
- No Performance metric, AI summary, budget remainder, actionable, recommendation, or Collaboration state may be fabricated.
- No design may imply readiness changes lifecycle or Campaign owns Collaboration workflow.
