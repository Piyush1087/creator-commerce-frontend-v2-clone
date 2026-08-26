# Brand Centre — Stage 2 functional reconciliation

Branch: `phase-g/brand-centre-brand-reconciliation`.
Baseline: `cbef201c571c6493c0a83ca4a6be12963faa959d` (clean Stage 0/1 worktree resumed).

## Accepted inputs

- Backend `creator-commerce-backend-v2-clone@884eed094706f091d5de494d1b72bcf36754a1cd`:
  authenticated `GET /api/v1/brand-centre/brand`, `consumer/brand-consumer.service.ts`,
  `brand-consumer.mapper.ts`, `brand-consumer.types.ts` and the PostgreSQL consumer tests.
- Systems `dummy_tcs@a6bed1f28564c002f7d76931de0b4dd960ea5ae1`.
- Accepted FE state/read architecture `62f88e3722226b23b20f017a9b69a63d2ca6db99`.
- Accepted UX `b2340be42deb713c0cef696f1e0b477c945df8ca` and unchanged Stage 0/1
  accepted visual-reference package. No Stitch ingestion, invocation, acceptance
  changes, redesign or final visual reconciliation in this stage.

## Integration

The Brand page composes a bounded feature: strict Zod response parser → authenticated
client → in-memory route-instance cache → semantic adapter → functional Aurora UI.
Only the consumer route is read by this workspace. No Brand selector is sent.
The cache is not persisted or shared across route instances/accounts. It aborts
superseded reads and unmounts, refreshes on focus, and polls the same consumer only
while supplied activity is LEARNING/REFRESHING. It does not interrupt an in-flight
read with a polling timer. Failures retain the last validated projection and mapped
view without changing readiness, freshness, authority or current-value kind.

All six current kinds survive parsing. VALUE([]) is evaluated empty; null is not
NO_CURRENT. Intentionally absent and not-owned nodes do not produce placeholder
slots. Component metadata uses the accepted typed path codec (including escaped
semantic IDs), nearest authoritative ancestor metadata, and quiet component-level
confirmation/freshness cues. Mixed summaries do not fabricate uniform freshness
or a generation timestamp. Raw candidates, traceability and runtime internals are
not rendered; unexpected contract fields fail as MALFORMED_RESPONSE.

Canonical visual assets and derived style are siblings with no legacy fallback.
Locations retain backend UUIDs and lifecycle/observation metadata, independent of
Serviceability. Opaque optional Persona context and legacy-compatible Location
contact JSON are validated and retained, not rendered as arbitrary properties.
No policy-gated editing, candidate actions, map, or additional workspace API is added.

Only Brand is operational. Other workspace names are disabled orientation labels.
The mobile selector is a native disclosure with Escape focus return. Shared shell
architecture/navigation remains unchanged. The header title changes from legacy
tab naming to `Brand`. Browser smoke also exposed the closed mobile drawer in the
accessibility tree; a bounded `inert`/`aria-hidden` fix now excludes its links while
closed without changing its layout, destinations or open-menu behavior.

## Compatibility and deferred work

Legacy DNA components, contracts, clients and exports remain available for logout,
UCE asset linking and public Brand-page consumers. Brand Preview and auth/session
implementation are unchanged. Only `/brand-centre` stops mounting the coupled legacy
DNA/account/budget/scan/planner consumers.

Functional layout preserves the seven-section order on all viewports and naturally
stacks Personas at 390px. Aurora primitives/tokens are used. No animation was added.
Final accepted-shell pixels, editorial learning composition, mature visual styling,
spacing and visual acceptance remain explicitly deferred.

## Validation

Focused tests cover schema rejection, all current kinds, independent readiness,
activity/freshness, metadata, stable IDs, 0–3 Personas, canonical/derived boundaries,
Serviceability partiality, hidden candidates, request preservation/cancellation,
section order and unavailable navigation. Standard commands:

```text
npm test -- src/features/brand-centre
npm test
npm run typecheck
npm run build
eslint <changed/new TypeScript files>
git diff --check
```

Local browser smoke uses a test-only harness outside this repository. It loads the
exact pinned backend consumer service/mapper with fixture dependency ports and
passes their serialized responses through the frontend parser before serving the
mock HTTP route. The normal login form/client and Brand route run unchanged with a
fictional local account. No backend/database or real account is changed.
Database-backed live runtime: `LIVE_RUNTIME_NOT_RUN`.

Browser checks are functional and scoped to this feature, not final visual or
whole-application accessibility certification. No hidden candidate DOM or
unavailable-workspace focus targets are introduced. Native disclosure keyboard
semantics and Escape focus return are checked alongside the closed-drawer fix.
