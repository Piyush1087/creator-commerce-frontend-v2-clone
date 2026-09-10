# Out of this freeze / out of MVP

Chrome hide is allowed. It is not proof that an OUT backend API is non-competing.

| Surface | Status | Freeze-branch treatment |
| --- | --- | --- |
| C-06 Creator Payouts | Still in progress; not accepted | Hidden from nav; `/creator/payouts` redirects to Settings payouts |
| Marketplace browse / guest marketplace | `OUT_OF_MVP` | Compatibility redirects / unavailable only; C-03 apply stays |
| Co-Pilot / Creator Co-Pilot | `OUT_OF_MVP` | Hidden from product; BE collab HITL mutations retired `410` |
| Creator Centre / Media Kit / Analytics | Deferred product (with C-02A) | Routes redirect to Creator Home |
| Live Razorpay money movement / Meta App Review | Provider debt | See backend `16-external-providers/` |

Canonical OUT API matrix lives on the backend freeze package: `creator-commerce-backend-v2/docs/ai-collaboration/mvp-canonical-freeze/out-of-mvp/README.md`.
