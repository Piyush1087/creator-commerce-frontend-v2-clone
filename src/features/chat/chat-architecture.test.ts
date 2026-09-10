import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CHAT_ROOT = join(ROOT, "src", "features", "chat");

function productionFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionFiles(path);
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")
      ? [path]
      : [];
  });
}

function productionSource(): string {
  return productionFiles(CHAT_ROOT)
    .filter((path) => !path.endsWith(".test.ts"))
    .map((path) => `${relative(ROOT, path)}\n${readFileSync(path, "utf8")}`)
    .join("\n");
}

describe("permanent Chat architecture boundary", () => {
  it("does not import legacy CoPilot business runtime or Home mock truth", () => {
    const source = productionSource();
    for (const forbidden of [
      "/api/v1/co-pilot",
      "co-pilot-client",
      "useBrandCoPilot",
      "HITL",
      "slotValues",
      "CoPilotUsage",
      "brand-home-mock",
      "GenerativeUIPayloadRenderer",
    ]) {
      expect(source, forbidden).not.toContain(forbidden);
    }
  });

  it("uses only permanent Chat endpoints for business answers", () => {
    const source = productionSource();
    const apiPaths = [...source.matchAll(/\/api\/v1\/[A-Za-z0-9_/-]+/gu)].map(
      (match) => match[0],
    );
    expect(apiPaths).toEqual(["/api/v1/chat/conversations"]);
    for (const forbiddenClient of [
      "brand-intelligence-client",
      "product-intelligence-client",
      "campaign-client",
      "offering-client",
      "collaboration-client",
      "settings-client",
    ]) {
      expect(source).not.toContain(forbiddenClient);
    }
  });

  it("reconciles Brand Home without a new Chat route or sidebar entry", () => {
    const page = readFileSync(
      join(
        ROOT,
        "src",
        "pages",
        "brand",
        "dashboard",
        "brand-dashboard-page.tsx",
      ),
      "utf8",
    );
    expect(page).toContain("useBrandChat");
    expect(page).toContain("BrandHomeBriefingWorkspace");
    expect(page).not.toContain("useBrandCoPilot");

    const sidebar = readFileSync(
      join(ROOT, "src", "layouts", "app-shell", "sidebar-items.ts"),
      "utf8",
    );
    const routes = readFileSync(
      join(ROOT, "src", "routes", "app-routes.tsx"),
      "utf8",
    );
    expect(sidebar).toContain("AUTH_ROUTES.brandDashboard");
    expect(sidebar).not.toContain('label: "Chat"');
    expect(sidebar).not.toContain("Marketplace");
    expect(sidebar).not.toContain("Co-Pilot");
    expect(routes).not.toContain("/brand/chat");
  });

  it("keeps permanent Chat independent from the Home data client", () => {
    const source = productionSource();
    expect(source).not.toContain("brand-home-client");
    expect(source).not.toContain("/api/v1/brand/home");
  });
});
