import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_ROUTES } from "../auth/constants";

describe("Instagram Intelligence E2/E3 authenticated workspace boundary", () => {
  it("is direct-address-only inside the existing authenticated shell", () => {
    const routes = readFileSync(
      join(process.cwd(), "src/routes/app-routes.tsx"),
      "utf8",
    );
    expect(AUTH_ROUTES.brandCentreInstagram).toBe("/brand-centre/instagram");
    expect(routes).toContain('path="instagram/*"');
    expect(routes).toContain("BrandCentreWorkspaceShell");
    expect(routes.lastIndexOf('path="instagram/*"')).toBeGreaterThan(
      routes.indexOf("<RequireAuth>"),
    );
    const shell = readFileSync(
      join(process.cwd(), "src/layouts/app-shell/AppShellLayout.tsx"),
      "utf8",
    );
    expect(shell).not.toContain("brandCentreInstagram");
  });

  it("keeps hidden Brand and E4 detail surfaces outside the mounted workspace", () => {
    const workspace = readFileSync(
      join(
        process.cwd(),
        "src/features/instagram-intelligence/components/instagram-workspace.tsx",
      ),
      "utf8",
    );
    const client = readFileSync(
      join(
        process.cwd(),
        "src/features/instagram-intelligence/api/instagram-b4-client.ts",
      ),
      "utf8",
    );
    for (const forbidden of [
      "brand persona",
      "brand meaning",
      "brand character",
      "source-profile",
      "latest-successful-by-source",
      "merge/ignore",
      "AI Match",
      "View details",
    ]) {
      expect(workspace).not.toContain(forbidden);
    }
    expect(client).not.toContain("/media/");
    expect(workspace).not.toContain('role="tab"');
    expect(workspace).not.toContain('role="tablist"');
  });
});
