import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("C06 P5 Creator payout workspace", () => {
  const source = readFileSync(
    "src/features/creator-payouts/components/CreatorPayoutsWorkspace.tsx",
    "utf8",
  );
  const css = readFileSync(
    "src/features/creator-payouts/creator-payouts.css",
    "utf8",
  );

  it("renders every required read-only surface", () => {
    for (const text of [
      "Upcoming",
      "Due or action required",
      "Processing",
      "Paid to date",
      "Obligations",
      "History",
      "Payout method",
      "Manage in Settings",
      "Load more",
    ])
      expect(source).toContain(text);
    expect(source).toContain("SideDrawer");
    expect(source).toContain("detailRequestId.current += 1");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("accessDenied");
    expect(source).toContain("PARTIAL");
    expect(source).toContain("legacy");
  });

  it("contains no payout execution, ETA, KYC, tax, PDF or legacy tranche UI", () => {
    expect(source).not.toMatch(
      /add funds|request payout|retry payout|estimated arrival|payout eta|kyc|tax|invoice|pdf|tranche|30\/70|bank verification/i,
    );
    expect(source).not.toMatch(/method:\s*"(POST|PUT|PATCH|DELETE)"/);
  });

  it("uses responsive table/card grammar without horizontal page overflow", () => {
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("table-layout: fixed");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain("#047857");
    expect(css).not.toMatch(/min-width:\s*(?:5|6|7|8|9)\d{2}px/);
  });

  it("reuses the accepted accessible drawer behavior", () => {
    const drawer = readFileSync(
      "src/design-system/aurora/components/SideDrawer.tsx",
      "utf8",
    );
    expect(drawer).toContain('role="dialog"');
    expect(drawer).toContain('aria-modal="true"');
    expect(drawer).toContain('event.key === "Escape"');
    expect(drawer).toContain('event.key !== "Tab"');
    expect(drawer).toContain("previousFocus.focus()");
  });

  it("keeps Manager-readable payouts outside the Instagram platform guard", () => {
    const routes = readFileSync("src/routes/app-routes.tsx", "utf8");
    expect(routes.indexOf("path={AUTH_ROUTES.creatorPayouts}")).toBeLessThan(
      routes.indexOf("<Route element={<RequireCreatorPlatformAccess />}>"),
    );
  });
});
