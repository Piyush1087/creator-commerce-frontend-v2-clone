# Brand Payouts provider-disabled MVP developer handoff

Status: `BRAND_PAYOUTS_PROVIDER_DISABLED_HANDOFF_READY`

This handoff closes `BRAND_PAYOUTS_WAVE_D_JOINT_PROVIDER_DISABLED_ACCEPTANCE_AND_HANDOFF_RUNNER_V1`. It is provider-disabled developer integration evidence, not real-money production readiness or deployment authority.

## Authority and accepted sources

- Product Authority: `f15a91d0ace8b2c424a539d79dbb120869233105`
- Phase C architecture: `3fb6b4246aa5f2ecb71c3bbfe99c56e395f30a92`
- MVP cutline: `9c991a8e8c8dfc90ccc4cf18e48ab1629d5f5b4f`
- Recovery charter: `23a074b01dbca141ddc997113a6ecbbc14e19f82`
- Standing bounded execution authority: `e349ab1716b06e49cb430158d9c2bc19e89980ed`
- Backend: `brand-payouts/wave-c-reserve-read-v1` at `a38102fd9662f1654c9572b19913b9e228385b73`, tree `adb8c129744dc5e9574328a75e59d802728bbe37`
- Frontend: `brand-payouts/wave-c-frontend-v1`; this evidence commit has parent `25441dd4fd228bec4d6c9fe9f39c2297318b6167`, accepted source tree `3490d5c936b207d6e1685aee6baff37e073257e0`

Backend ancestry is C04 `ec395bf5760b295dddd9c3f7e9c2f05485b6b743` → Wave B `46c71fd554d7621d9bd13d1bbc3115646a7c56bd` → Wave C correction `a38102fd9662f1654c9572b19913b9e228385b73`. Frontend contains accepted P3A source base `7c75a4c8f5a0df3a1fb82d2f707b1c6b03d56d2a` and Wave C implementation `25441dd4fd228bec4d6c9fe9f39c2297318b6167`.

## Migrations

Integrate all 86 committed migrations in repository order. The financial lineage tail is:

1. `20260911125000_c04_brand_payouts_reserve_entitlement_lineage`
2. `20260912100000_brand_payouts_wave_b_normal_path`

The Payouts M1 SQL SHA-256 is `887e5bb6bd262a4dd02e42a798db55bd136d97bf6a923df7e6466573f11d1f84`. Wave C and Wave D changed no migration.

## Evidence lineage and results

- P3A checkpoint/evidence: `67224e5f59175d7300af8984bc2bf8ec1da1d6cb`; accepted frontend source base `7c75a4c8f5a0df3a1fb82d2f707b1c6b03d56d2a`.
- Wave B backend handoff: backend commit `46c71fd554d7621d9bd13d1bbc3115646a7c56bd`, file `docs/ai-collaboration/brand-payouts-wave-b-backend-handoff.md`.
- Wave C handoff: frontend commit `25441dd4fd228bec4d6c9fe9f39c2297318b6167`, file `docs/ai-collaboration/brand-payouts-wave-c-frontend-handoff.md`.
- Wave D proof and decision register are indexed beside this handoff.

Wave D reused the accepted Wave C frontend full suite (114 files / 895 tests), responsive matrix (390/767/768/1440), and Axe serious/critical zero because source was unchanged. Fresh Wave D builds passed: Nest build plus assets and frontend production build (2,111 modules). Fresh PostgreSQL 16 migrated 0→86. The focused backend contract lane passed 48 tests plus the corrected three-test PostgreSQL lane.

The joint built-stack lane proved Owner and Finance exact server-ID reserve approval, exactly one completed approval/effect each, C04 instruction/agreement version/hash and ₹118 INR ledger lineage, Campaign Manager read-only isolation, cross-Brand denial from the focused PostgreSQL proof, production Brand Return capability unavailable despite positive available funds, activity detail/Back/refresh restoration, mobile/desktop zero overflow, unauthenticated redirect, empty browser console, and controlled shutdown.

P4B test evidence covers exact server-derived Kolkata-to-UTC NET_7/15/30/45/60 due rules and caller-independent economics. Current C05 destination ID/version/mapping is fenced before claim. The deterministic test-only provider produced one normal transfer and settlement receipt; its row is explicitly `DETERMINISTIC_TEST` and cannot be selected by production binding. Production provider methods/actions remained zero.

## Local integration

Integrate backend first, then frontend:

1. Bring in backend `a38102fd9662f1654c9572b19913b9e228385b73`, preserving all 86 migrations and verifying the M1 hash above.
2. Configure a disposable/local PostgreSQL `DATABASE_URL`; apply `prisma migrate deploy`; provide non-placeholder JWT/auth and mail configuration. For provider-disabled development, leave payout/return provider credentials absent.
3. Start the backend and verify `/`, `/health`, database health, and the Brand Payouts reserve/overview/activity routes.
4. Bring in frontend source `25441dd4fd228bec4d6c9fe9f39c2297318b6167`; build with the exact local API origin (`VITE_STAGE=local`, `VITE_API_URL=<backend-or-local-proxy-origin>`).
5. Keep the command-surface mode atomic: current accepted configuration exposes Add funds and Brand Return only in Settings; Payouts displays the explicit Settings-active notice. Do not enable both surfaces simultaneously.
6. Authenticate through the normal application session flow and verify Owner, Finance Admin, Campaign Manager, unauthenticated, and cross-Brand behavior before further development.

For deterministic acceptance, replace outbound notification transport/workers with local sinks and install a non-loopback deny guard before AppModule bootstrap. Wave D's test-only launcher SHA-256 was `78d8d00b91ed7140af5678667786eb22474d88fab68e9d352fe928aee1f9be54`; it was deleted after shutdown. It recorded zero non-loopback application attempts.

## Limitations and deferred gates

Production payout and Brand Return providers remain disabled and truthfully unavailable. This handoff does not authorize credentials, provider calls, real-money operations, production/AWS work, canonical merge, or deployment. The inherited repository-wide backend CRLF/Prettier baseline and three moderate application-shell landmark findings remain disclosed; changed-scope lint and Brand Payouts serious/critical accessibility passed.

Deferred: P3S support, generalized P4R/P5R recovery, provider-enabled P6, legal/tax gates where applicable, deployment, canonical merge, and complete-V1 co-residence acceptance.
