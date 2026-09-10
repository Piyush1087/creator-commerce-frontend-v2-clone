import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const campaignsCss = readFileSync(
  new URL("./creator-campaigns.css", import.meta.url),
  "utf8",
);
const commandSource = readFileSync(
  new URL("./components/CommandCenterWorkspace.tsx", import.meta.url),
  "utf8",
);
const historySource = readFileSync(
  new URL("./components/HistoryArchiveWorkspace.tsx", import.meta.url),
  "utf8",
);
const teamCss = readFileSync(
  new URL(
    "../settings/components/creator/creator-team-settings.css",
    import.meta.url,
  ),
  "utf8",
);

describe("Creator campaigns viewport contract", () => {
  it("hides the production table below 768px and shows card rows", () => {
    expect(campaignsCss).toMatch(
      /\.cc-production-table\s*\{[\s\S]*display:\s*none/,
    );
    expect(campaignsCss).toMatch(
      /@media \(min-width: 768px\)[\s\S]*\.cc-production-table\s*\{[\s\S]*display:\s*table/,
    );
    expect(campaignsCss).toMatch(
      /@media \(min-width: 768px\)[\s\S]*\.cc-mobile-rows\s*\{[\s\S]*display:\s*none/,
    );
    expect(campaignsCss).toMatch(
      /\.cc-mobile-row\s*\{[\s\S]*?padding:\s*var\(--space-md\)/,
    );
  });

  it("renders dedicated mobile rows for active, pending, and history lists", () => {
    expect(commandSource).toContain('className="cc-mobile-rows"');
    expect(historySource).toContain('className="cc-mobile-rows"');
  });

  it("keeps Creator team roster as labeled cards on narrow viewports", () => {
    expect(teamCss).toContain("content: attr(data-label)");
    expect(teamCss).toContain(".creator-team-roster__header");
    expect(teamCss).toContain("display: none");
  });
});
