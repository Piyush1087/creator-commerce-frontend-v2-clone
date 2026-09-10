import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { MobileBottomNav } from "./MobileBottomNav";

vi.mock("../../shared/auth/use-auth-session", () => ({
  useAuthSession: () => ({ currentUser: { role: "BRAND" } }),
}));

const shellCss = readFileSync(new URL("./app-shell.css", import.meta.url), "utf8");
const tokensCss = readFileSync(
  new URL("../../design-system/aurora/tokens.css", import.meta.url),
  "utf8",
);

function token(name: string) {
  const value = tokensCss.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "iu"))?.[1];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  return channels
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("mobile bottom navigation active-state accessibility", () => {
  it("uses an approved AA contrast token while retaining the active indicator", () => {
    const activeRule = shellCss.match(
      /\.aurora-bottom-nav__item--active\s*\{([^}]*)\}/u,
    )?.[1];
    expect(activeRule).toContain("color: var(--color-secondary)");
    expect(contrast(token("--color-secondary"), "#ffffff")).toBeGreaterThanOrEqual(
      4.5,
    );

    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/brand-centre/offerings"] },
        createElement(MobileBottomNav),
      ),
    );
    expect(html).toContain('<nav class="aurora-bottom-nav" aria-label="Primary">');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("aurora-bottom-nav__item--active");
    expect(html).toContain("<span>Brand Centre</span>");
  });

  it.each([390, 767])("keeps the corrected navigation visible at %ipx", (width) => {
    expect(width).toBeLessThanOrEqual(767);
    expect(shellCss).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.aurora-bottom-nav\s*\{[\s\S]*?display:\s*flex;/u,
    );
  });

  it.each([768, 1440])("does not expose the mobile navigation at %ipx", (width) => {
    expect(width).toBeGreaterThan(767);
    expect(shellCss).toMatch(/\.aurora-bottom-nav\s*\{[^}]*display:\s*none;/u);
  });
});
