import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("C-05 frontend convergence architecture", () => {
  it("uses one actor state for the persistent shell and Creator Settings", () => {
    const appShellLayout = read("src/layouts/app-shell/AppShellLayout.tsx");
    const settingsLayout = read(
      "src/pages/creator/settings/creator-settings-layout.tsx",
    );

    expect(appShellLayout).toContain("CreatorWorkspaceActorProvider");
    expect(appShellLayout).toContain("useCreatorWorkspaceActorState");
    expect(appShellLayout).toContain("creatorShellState={creatorShellState}");
    expect(settingsLayout).toContain("useCreatorWorkspaceActorState");
    expect(settingsLayout).toContain("shellState={shellState}");
  });

  it("mounts the five canonical Settings destinations and compatibility redirect", () => {
    const routes = read("src/routes/app-routes.tsx");

    for (const destination of [
      "CreatorSettingsAccountPage",
      "CreatorSettingsProfilePage",
      "CreatorSettingsTeamPage",
      "CreatorSettingsInstagramPage",
      "CreatorSettingsPayoutsPage",
    ]) {
      expect(routes).toContain(destination);
    }
    expect(routes).toContain('<Navigate to="account" replace />');
    expect(routes).toContain("creatorSettingsInstagram");
    expect(routes).toContain("CreatorSettingsActionGuard");
  });

  it("uses the secure payout/legal implementation as Settings authority", () => {
    const page = read(
      "src/pages/creator/settings/creator-settings-payouts-page.tsx",
    );
    expect(page).toContain("CreatorPayoutLegalSettings");
    expect(page).not.toContain("CreatorPayoutsSettings");
  });

  it("keeps Creator Center distinct and does not freeze it as Media Kit", () => {
    const routes = read("src/routes/app-routes.tsx");
    const centreRoute = routes.slice(
      routes.indexOf("CREATOR_WORKSPACE_ENTRY technical mount"),
      routes.indexOf("AUTH_ROUTES.creatorAnalytics"),
    );
    expect(centreRoute).toContain("AUTH_ROUTES.creatorCentre");
    expect(centreRoute).toContain("CreatorCentrePage");
    expect(centreRoute).not.toContain("CreatorMediaKitPage");
  });

  it("keeps Marketplace out of shell and authenticated promotional CTAs", () => {
    const sidebar = read("src/layouts/app-shell/sidebar-items.ts");
    const footer = read("src/layouts/app-shell/bottom-nav-items.ts");
    const dashboard = read(
      "src/pages/creator/dashboard/creator-dashboard-page.tsx",
    );
    const homeData = read(
      "src/features/creator-centre/mock-data/centre-mock.ts",
    );
    const homeSnapshot = homeData.slice(
      homeData.indexOf("MOCK_HOME_SNAPSHOT"),
      homeData.indexOf("MOCK_HERO_OPPORTUNITY"),
    );
    const mediaKitSnapshot = homeData.slice(homeData.indexOf("MOCK_MEDIA_KIT"));
    const routes = read("src/routes/app-routes.tsx");

    expect(sidebar).not.toContain('label: "Marketplace"');
    expect(footer).not.toContain('label: "Marketplace"');
    expect(dashboard).not.toContain("Marketplace");
    expect(homeSnapshot).not.toMatch(/marketplace/iu);
    expect(mediaKitSnapshot).not.toMatch(/marketplace/iu);
    expect(routes).toContain("COMPATIBILITY_RECONCILIATION_ONLY");
  });

  it("does not add optional notifications or downstream business behavior", () => {
    const routes = read("src/routes/app-routes.tsx");
    expect(routes).not.toMatch(
      /CreatorSettingsNotifications|settings\/notifications/,
    );
    expect(routes).not.toMatch(
      /AssistantApply|NegotiationCommand|ExecutePayout/,
    );
  });
});
