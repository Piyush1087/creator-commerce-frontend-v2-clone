import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_ROUTES } from "../auth/constants";

describe("Instagram Intelligence B4 authenticated route", () => {
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
});
