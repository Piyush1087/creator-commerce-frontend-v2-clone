import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HOME_ROOT = join(ROOT, "src", "features", "brand-dashboard");

function productionFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionFiles(path);
    return (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts")
      ? [path]
      : [];
  });
}

function homeProductionSource(): string {
  return productionFiles(HOME_ROOT)
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

describe("permanent Brand Home architecture boundary", () => {
  it("consumes only the permanent Home aggregator", () => {
    const source = homeProductionSource();
    const apiPaths = [...source.matchAll(/\/api\/v1\/[A-Za-z0-9_/-]+/gu)].map(
      (match) => match[0],
    );
    expect(apiPaths).toEqual(["/api/v1/brand/home"]);
    for (const forbidden of [
      "/api/v1/co-pilot",
      "campaign-client",
      "collaboration-client",
      "settings-client",
      "provider-client",
      "brand-intelligence-client",
      "product-intelligence-client",
      "offering-client",
      "brand-home-mock",
    ]) {
      expect(source, forbidden).not.toContain(forbidden);
    }
  });

  it("uses the accepted responsive split and explicit keyboard focus styling", () => {
    const css = [
      readFileSync(join(HOME_ROOT, "brand-dashboard-home.css"), "utf8"),
      readFileSync(
        join(ROOT, "src", "features", "creator-centre", "creator-centre.css"),
        "utf8",
      ),
    ].join("\n");
    expect(css).toContain("@media (min-width: 768px)");
    expect(css).toContain("width: 70%");
    expect(css).toContain("width: 30%");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain(".brand-home-action:focus-visible");
    expect(css).toContain("min-height: 44px");
  });
});
