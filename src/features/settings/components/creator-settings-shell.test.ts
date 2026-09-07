import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CreatorSettingsShell } from "./creator-settings-shell";

describe("CreatorSettingsShell", () => {
  it("fails closed while access is unresolved and keeps Account security actionable", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/creator/settings"] },
        createElement(CreatorSettingsShell),
      ),
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('href="/creator/settings/account"');
    expect(html).not.toContain('href="/creator/settings/payouts"');
    expect(html).not.toContain("Marketplace");
  });

  it("announces truthful recovery reasons on disabled administrative tabs", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(CreatorSettingsShell, {
          shellState: {
            status: "RECOVERY",
            actorContext: null,
            reason: "Workspace membership requires support review.",
          },
        }),
      ),
    );

    expect(html).toContain("Workspace settings are limited");
    expect(html).toContain("Workspace membership requires support review.");
    expect((html.match(/aria-disabled="true"/g) ?? []).length).toBe(4);
  });
});
