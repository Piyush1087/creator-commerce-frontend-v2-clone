import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  readFileSync(join(process.cwd(), file), "utf8");

describe("C05-P1C Creator Instagram frontend boundaries", () => {
  it("uses Aurora, the shared Settings card, and the accessible shared drawer", () => {
    const component = source(
      "src/features/settings/components/creator/creator-instagram-settings.tsx",
    );
    expect(component).toContain("design-system/aurora");
    expect(component).toContain("SettingsSectionCard");
    expect(component).toContain("SideDrawer");
    expect(component).toContain('role="status"');
    expect(component).toContain('aria-live="polite"');
  });

  it("ships the 390/mobile stacking and overflow seams with the feature", () => {
    const css = source(
      "src/features/settings/components/creator/creator-instagram-settings.css",
    );
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("grid-template-columns: 1fr");
    expect(css).toContain("width: 100%");
    expect(css).toContain("min-width: 0");
    expect(css).not.toContain("100vw");
  });

  it("contains only Instagram recovery and no Marketplace or platform expansion", () => {
    const files = [
      "src/features/settings/components/creator/creator-instagram-settings.tsx",
      "src/features/settings/contracts/creator-instagram-settings.contracts.ts",
      "src/features/settings/api/creator-instagram-settings-client.ts",
    ];
    for (const file of files) {
      expect(source(file)).not.toMatch(/MARKETPLACE|TIKTOK|YOUTUBE|LINKEDIN/);
    }
  });

  it("leaves route composition to P2", () => {
    const routes = source("src/routes/app-routes.tsx");
    expect(routes).not.toContain("CreatorInstagramSettingsOAuthCallback");
    expect(routes).not.toContain("CreatorInstagramSettings");
  });

  it("reuses C01 for initial connect rather than duplicating its security flow", () => {
    const client = source(
      "src/features/settings/api/creator-instagram-settings-client.ts",
    );
    expect(client).toContain("authorizeCreatorInstagram");
    expect(client).toContain("creator-entry-client");
    expect(client).not.toContain('/instagram/complete"');
  });
});
