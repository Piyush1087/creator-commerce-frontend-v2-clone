import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tabsCss = readFileSync(new URL("./CampaignListTabs.css", import.meta.url), "utf8");
const tabsSource = readFileSync(new URL("./CampaignListTabs.tsx", import.meta.url), "utf8");
const responsiveCss = readFileSync(
  new URL("../uce-responsive.css", import.meta.url),
  "utf8",
);

describe("UCE campaigns list table→cards", () => {
  it("does not keep a 900px performance-matrix on mobile", () => {
    expect(responsiveCss).not.toMatch(
      /\.performance-matrix\s*\{[^}]*min-width:\s*900px/,
    );
    expect(tabsCss).not.toContain("min-width: 900px");
  });

  it("stacks operations rows as labeled cards below 768px", () => {
    expect(tabsCss).toMatch(
      /@media \(max-width: 767px\)[\s\S]*\.performance-matrix tbody tr\s*\{[\s\S]*padding:\s*var\(--space-md\)/,
    );
    expect(tabsCss).toContain("content: attr(data-label)");
    expect(tabsCss).toContain("display: none");
  });

  it("labels every operations cell for the card stack", () => {
    for (const label of [
      'data-label="Campaign Context"',
      'data-label="Status Toggle"',
      'data-label="Influencer Pipeline"',
      'data-label="Budget Consumption"',
      'data-label="Actions"',
    ]) {
      expect(tabsSource).toContain(label);
    }
  });
});
