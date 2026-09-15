import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PortfolioConsumerSchema,
  PortfolioCommandSchema,
  PortfolioDestinationSchema,
} from "./portfolio-consumer";
import {
  portfolioFixture,
  manualItem,
  portfolioReferenceCommand,
  portfolioActor,
} from "../testing/portfolio.fixture";
import { getSidebarNavItemsForRole } from "../../../layouts/app-shell/sidebar-items";
import { creatorBottomNavItems } from "../../../layouts/app-shell/bottom-nav-items";
import { AUTH_ROUTES } from "../../auth/constants";
describe("Portfolio private consumer and navigation", () => {
  it.each(["OWNER", "MANAGER", "ASSISTANT"] as const)(
    "accepts strict %s role and projects independent nav",
    (role) => {
      expect(
        PortfolioConsumerSchema.parse(portfolioFixture(role)).context.canCurate,
      ).toBe(role !== "ASSISTANT");
      expect(
        getSidebarNavItemsForRole("CREATOR", portfolioActor(role)).find(
          (i) => i.path === AUTH_ROUTES.creatorPortfolio,
        )?.availability,
      ).toBe("AVAILABLE");
    },
  );
  it("rejects authority disagreement, duplicate IDs, private lineage and extra fields", () => {
    const data = portfolioFixture("OWNER", [manualItem()]);
    for (const delta of [
      { context: { role: "ASSISTANT", canCurate: true } },
      { items: [manualItem(), manualItem()] },
      { rawMedia: "not admitted" },
      { items: [{ ...manualItem(), sourceCaptureRef: "private" }] },
    ])
      expect(
        PortfolioConsumerSchema.safeParse({ ...data, ...delta }).success,
      ).toBe(false);
  });
  it.each([
    "http://example.com/work",
    "https://localhost/work",
    "https://127.0.0.1/work",
    "https://cdninstagram.com/raw.jpg",
    "https://example.com/?sig=synthetic",
    "https://example.com/?Policy=synthetic",
    "https://example.com/?access_token=synthetic",
    "https://name:synthetic@example.com/work",
  ])("rejects unsafe/ephemeral destination %s", (url) =>
    expect(PortfolioDestinationSchema.safeParse(url).success).toBe(false),
  );
  it("rejects unsupported Story/private provenance and bounds source fields", () => {
    expect(
      PortfolioConsumerSchema.safeParse({
        ...portfolioFixture(),
        items: [{ ...manualItem(), kind: "INSTAGRAM_STORY" }],
      }).success,
    ).toBe(false);
    expect(
      PortfolioCommandSchema.safeParse({
        ...portfolioReferenceCommand,
        title: "x".repeat(161),
      }).success,
    ).toBe(false);
    expect(
      PortfolioCommandSchema.safeParse({
        ...portfolioReferenceCommand,
        intent: "DELETE_SOURCE",
      }).success,
    ).toBe(false);
  });
  it("keeps five bottom destinations and source-independent route", () => {
    expect(creatorBottomNavItems.map((i) => i.label)).toEqual([
      "Home",
      "Insights",
      "Campaigns",
      "Collaborations",
      "Settings",
    ]);
    const routes = readFileSync(
      new URL("../../../routes/app-routes.tsx", import.meta.url),
      "utf8",
    );
    expect(routes.indexOf("path={AUTH_ROUTES.creatorPortfolio}")).toBeLessThan(
      routes.indexOf("<Route element={<RequireCreatorPlatformAccess />}>"),
    );
  });
});
