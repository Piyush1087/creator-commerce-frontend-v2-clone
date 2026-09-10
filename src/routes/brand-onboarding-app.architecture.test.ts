import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src", "routes", "brand-onboarding-app.tsx"),
  "utf8",
);

describe("Brand onboarding freeze chrome", () => {
  it("does not mount the identity-test surface", () => {
    expect(source).not.toContain("BrandIntelligenceIdentityTestPage");
    expect(source).toContain('path="brand/intelligence/identity-test"');
    expect(source).toContain('<Navigate to="/" replace />');
  });
});
