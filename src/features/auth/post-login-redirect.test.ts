import { describe, expect, it } from "vitest";

import { resolvePostLoginPath } from "./post-login-redirect";

const CAMPAIGN_ID = "11111111-1111-4111-8111-111111111111";

describe("post-login redirect policy", () => {
  it.each([
    ["/creator/onboarding", "/creator/onboarding"],
    ["/creator/marketplace", "/creator/marketplace"],
    [`/marketplace/${CAMPAIGN_ID}`, `/creator/marketplace/${CAMPAIGN_ID}`],
    ["/marketplace?brand_slug=safe-brand", "/creator/marketplace?brand_slug=safe-brand"],
    ["/marketplace/invite/safe_token-123", "/marketplace/invite/safe_token-123"],
    ["/brand/safe-brand", "/brand/safe-brand"],
  ])("preserves the supported Creator return %s", (from, expected) => {
    expect(resolvePostLoginPath("CREATOR", from)).toBe(expected);
  });

  it.each([
    "/brand/dashboard",
    "/brand-centre/offerings",
    "/brand/settings/integrations?tab=instagram",
    "/brand/onboarding/verification",
  ])("preserves the supported Brand return %s", (from) => {
    expect(resolvePostLoginPath("BRAND", from)).toBe(from);
  });

  it.each([
    "//evil.example",
    "///evil.example",
    String.raw`/\/evil.example`,
    String.raw`/\evil.example`,
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "https://evil.example",
    "/%2f%2fevil.example",
    "/%5cevil.example",
    "/%252f%252fevil.example",
    "/creator/home\u0000/evil.example",
    "/unsupported/internal/route",
  ])("falls back instead of navigating to %s", (from) => {
    expect(resolvePostLoginPath("CREATOR", from)).toBe("/creator/home");
    expect(resolvePostLoginPath("BRAND", from)).toBe("/brand/dashboard");
  });
});
