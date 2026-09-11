# Security and release hygiene check (§15)

**Date:** 2026-09-11  
**Scope:** freeze-branch frontend scan. Live creator-dev ECS proof is on backend-v2 `15-security/security-release-check.md`. Not a pentest. **creator-prod not inspected.** OTP codes are not recorded here.

## Hazard scan

| Hazard | Finding | Class |
| --- | --- | --- |
| Hard-coded OTPs / fixed `123456` | FE does not mint OTP codes. BE static test forbids fixed six-digit bypass in deployable config | Guard on BE |
| Frontend-only authorization | `RequireAuth`, Creator platform guard, Settings action guards. Mutations stay backend-enforced | Keep in §18 |
| Hidden OUT chrome | Marketplace / Co-Pilot / Centre / old payout hubs hidden; APIs may still exist on BE | Competing BE writes retired `410` |
| Provider success simulation | FE must not fake IG/Razorpay success | INV-10 live providers later |

## Required posture

```text
NO_KNOWN_DEPLOYABLE_SECURITY_BYPASS  = DECLARED 2026-09-11
  bound = freeze source + live creator-dev ECS env
  not freeze PASS
  not creator-prod
```

Canonical AWS-dev evidence: backend-v2 `docs/ai-collaboration/mvp-canonical-freeze/15-security/security-release-check.md` (`STAGE=dev`, named targeting list `test@creator.com`, `[OTP]` logs present).

## Known non-bypass debt

Non-prod OTP logging is a BE tester aid. It is **not** a fixed OTP.
