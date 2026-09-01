import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");
const runtime = [
  "src/features/creator-onboarding/api/creator-entry-client.ts",
  "src/features/creator-onboarding/components/creator-entry-view.tsx",
  "src/features/creator-onboarding/components/creator-platform-route-guard.tsx",
  "src/features/creator-onboarding/utils/creator-entry-continuation-session.ts",
  "src/pages/creator/onboarding/creator-instagram-oauth-callback-page.tsx",
  "src/routes/creator-onboarding-app.tsx",
]
  .map(read)
  .join("\n");

describe("C01 Creator Entry architecture", () => {
  it("retires every legacy onboarding authority from canonical runtime", () => {
    for (const forbidden of [
      "/creator-onboarding/handle-check",
      "/creator-onboarding/stage-features",
      "/creator-onboarding/signup",
      "/creator-onboarding/verify-otp",
      "/creator-onboarding/waitlist",
      "/creator-onboarding/meta-connect",
      "/creator-onboarding/activate-sync",
      "AI_ENGINE_SYNCED",
      "skipInstagramConnect",
      "markInstagramConnectSkipped",
      "stageCreatorFeatures",
      "joinCreatorWaitlist",
      "onboardingTrackId",
    ])
      expect(runtime).not.toContain(forbidden);
  });

  it("keeps continuation secrets session-only and out of URLs/logging", () => {
    const storage = read(
      "src/features/creator-onboarding/utils/creator-entry-continuation-session.ts",
    );
    expect(storage).toContain("sessionStorage");
    expect(storage).not.toContain("localStorage");
    expect(storage).not.toContain("URLSearchParams");
    expect(storage).not.toContain("console.");
  });

  it("guards Creator product routes without changing Brand routes", () => {
    const routes = read("src/routes/app-routes.tsx");
    const guardStart = routes.indexOf(
      "<Route element={<RequireCreatorPlatformAccess />}>",
    );
    expect(guardStart).toBeGreaterThan(routes.indexOf("brandSettings"));
    expect(routes.indexOf("creatorHome")).toBeGreaterThan(guardStart);
    expect(routes.indexOf('path="/creator/onboarding/*"')).toBeGreaterThan(
      guardStart,
    );
    expect(routes.indexOf("instagramCallback")).toBeGreaterThan(guardStart);
  });

  it("uses backend readiness directly so Insights UNKNOWN or UNAVAILABLE cannot become a client gate", () => {
    const guard = read(
      "src/features/creator-onboarding/components/creator-platform-route-guard.tsx",
    );
    expect(guard).toContain("state.canEnterCreatorPlatform");
    expect(guard).not.toContain("insightsCapability");
    expect(guard).not.toContain("basicAuthorization");
  });

  it("keeps generic and invitation Campaign entry paths distinct and never auto-opens Apply", () => {
    const campaign = read(
      "src/features/creator-campaigns/components/CampaignDetailWorkspace.tsx",
    );
    expect(campaign).toContain("if (inviteToken)");
    expect(campaign).toContain("issueCampaignApplyContinuation");
    expect(campaign).toContain('navigate("/creator/onboarding")');
    expect(campaign).not.toContain("autoApply");
    const entry = read(
      "src/features/creator-onboarding/components/creator-entry-view.tsx",
    );
    expect(entry).toContain("READY_TO_RETURN");
    expect(entry).not.toContain("CampaignApplicationWizard");
  });

  it("scrubs provider parameters and has no client-controlled redirect URI", () => {
    const callback = read(
      "src/pages/creator/onboarding/creator-instagram-oauth-callback-page.tsx",
    );
    const client = read(
      "src/features/creator-onboarding/api/creator-entry-client.ts",
    );
    expect(callback).toContain("history.replaceState");
    expect(callback).toContain('params.get("error_description")');
    expect(client).not.toContain("redirectUri");
  });
});
