import { describe, expect, it } from "vitest";

import { AUTH_ROUTES } from "../../auth/constants";
import { ChatNavigationSchema } from "../contracts/chat.schemas";
import { CHAT_TEST_IDS } from "../testing/chat-fixtures";
import {
  resolveChatNavigation,
  UnsafeChatNavigationError,
} from "./chat-navigation";

describe("code-owned Chat navigation", () => {
  it.each([
    [{ destinationId: "HOME" as const }, AUTH_ROUTES.brandDashboard],
    [{ destinationId: "BRAND_CENTRE" as const }, AUTH_ROUTES.brandCentre],
    [{ destinationId: "OFFERINGS" as const }, AUTH_ROUTES.brandCentreOfferings],
    [
      {
        destinationId: "OFFERINGS" as const,
        entityRef: { type: "OFFERING" as const, id: CHAT_TEST_IDS.offering },
      },
      `/brand-centre/offerings/${CHAT_TEST_IDS.offering}`,
    ],
    [{ destinationId: "CAMPAIGNS" as const }, AUTH_ROUTES.brandUceCampaigns],
    [
      {
        destinationId: "CAMPAIGNS" as const,
        entityRef: { type: "CAMPAIGN" as const, id: CHAT_TEST_IDS.campaign },
      },
      `/brand/uce/campaigns/${CHAT_TEST_IDS.campaign}`,
    ],
  ])("maps %o to the trusted route", (navigation, expected) => {
    expect(resolveChatNavigation(navigation)).toBe(expected);
  });

  it("fails closed on mismatched entity and destination types", () => {
    expect(() =>
      resolveChatNavigation({
        destinationId: "CAMPAIGNS",
        entityRef: { type: "OFFERING", id: CHAT_TEST_IDS.offering },
      }),
    ).toThrow(UnsafeChatNavigationError);
    expect(() =>
      resolveChatNavigation({
        destinationId: "HOME",
        entityRef: { type: "CAMPAIGN", id: CHAT_TEST_IDS.campaign },
      }),
    ).toThrow(UnsafeChatNavigationError);
  });

  it.each(["//evil.example", "\\evil", "%2Fadmin", "campaign/id"])(
    "rejects hostile entity id %s through the safe-internal-path boundary",
    (id) => {
      expect(() =>
        resolveChatNavigation({
          destinationId: "CAMPAIGNS",
          entityRef: { type: "CAMPAIGN", id },
        }),
      ).toThrow(UnsafeChatNavigationError);
    },
  );

  it("rejects unknown destinations and arbitrary backend URLs at validation", () => {
    expect(
      ChatNavigationSchema.safeParse({ destinationId: "MARKETPLACE" }).success,
    ).toBe(false);
    expect(
      ChatNavigationSchema.safeParse({
        destinationId: "HOME",
        url: "https://evil.example",
      }).success,
    ).toBe(false);
  });
});
