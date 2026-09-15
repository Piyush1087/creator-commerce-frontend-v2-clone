import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("Audience V1 route access ownership", () => {
  it("keeps authenticated explicit Team read access independent of personal platform onboarding", () => {
    const source = readFileSync("src/routes/app-routes.tsx", "utf8");
    const audience = source.indexOf("path={AUTH_ROUTES.creatorAudience}");
    const platformGate = source.indexOf(
      "<Route element={<RequireCreatorPlatformAccess />}>",
    );
    expect(audience).toBeGreaterThan(source.indexOf("<RequireAuth"));
    expect(audience).toBeLessThan(platformGate);
    expect(source.slice(audience, platformGate)).toContain(
      'requiredAction="INSIGHTS_AUDIENCE_READ"',
    );
    expect(source.slice(platformGate)).toContain(
      'requiredAction="INSIGHTS_CONTENT_READ"',
    );
  });
});
