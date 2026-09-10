import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Creator Home frontend boundary", () => {
  it("uses one aggregate API and no owner API assembly", () => {
    const client = readFileSync(
      resolve("src/features/creator-home/api/creator-home-client.ts"),
      "utf8",
    );
    expect(client.match(/authenticatedFetch\(/g)).toHaveLength(1);
    expect(client).toContain("/api/v1/creator/home");
    expect(client).not.toMatch(/applications|collaborations|opportunities/);
  });

  it("replaces only the Home page and does not mount Creator Center or AI scope", () => {
    const page = readFileSync(
      resolve("src/pages/creator/centre/creator-home-page.tsx"),
      "utf8",
    );
    expect(page).toContain("CreatorHomeWorkspace");
    expect(page).not.toMatch(
      /CreatorCentre|Assistant|CoPilot|Analytics|MediaKit/,
    );
  });

  it("uses safe-area padding and the canonical mobile breakpoint", () => {
    const css = readFileSync(
      resolve("src/features/creator-home/creator-home.css"),
      "utf8",
    );
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).not.toContain("100vw");
  });
});
