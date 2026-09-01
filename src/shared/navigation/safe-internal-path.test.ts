import { describe, expect, it } from "vitest";

import {
  isSupportedInternalPath,
  resolveSafeInternalPath,
} from "./safe-internal-path";

describe("safe internal navigation", () => {
  it.each([
    "/creator/onboarding",
    "/creator/marketplace",
    "/creator/marketplace/11111111-1111-4111-8111-111111111111?source=invite",
    "/creator/centre",
    "/creator/settings/account",
    "/creator/settings/team",
    "/creator/settings/instagram",
    "/creator/team-invitations/accept#token=safe-token",
    "/marketplace",
    "/marketplace/11111111-1111-4111-8111-111111111111",
    "/marketplace/invite/safe_token-123",
    "/brand/example-brand",
    "/brand/dashboard",
    "/brand/settings/integrations?tab=instagram",
    "/brand/onboarding/verification",
    "/forgot-password",
    "/reset-password",
  ])("accepts the supported Creator Shop path %s", (path) => {
    expect(isSupportedInternalPath(path)).toBe(true);
    expect(resolveSafeInternalPath(path, "/creator/home")).toBe(path);
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
    "/%255cevil.example",
    "/%E0%A4%A",
    "/creator/home\n/evil.example",
    "/unsupported/internal/route",
    "",
  ])("rejects the untrusted destination %s", (path) => {
    expect(isSupportedInternalPath(path)).toBe(false);
    expect(resolveSafeInternalPath(path, "/creator/home")).toBe(
      "/creator/home",
    );
  });

  it("uses root when even the caller fallback is unsupported", () => {
    expect(
      resolveSafeInternalPath("//evil.example", "https://evil.example"),
    ).toBe("/");
  });
});
