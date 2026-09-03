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
    [
      {
        destinationId: "BRAND_CENTRE" as const,
        entityRef: { type: "BRAND" as const, id: CHAT_TEST_IDS.brand },
      },
      AUTH_ROUTES.brandCentre,
    ],
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
    [
      { destinationId: "COLLABORATIONS" as const },
      AUTH_ROUTES.brandCollaborations,
    ],
    [
      {
        destinationId: "COLLABORATIONS" as const,
        entityRef: {
          type: "COLLABORATION" as const,
          id: CHAT_TEST_IDS.conversation,
        },
      },
      `${AUTH_ROUTES.brandCollaborations}?thread=${CHAT_TEST_IDS.conversation}`,
    ],
    [{ destinationId: "SETTINGS" as const }, AUTH_ROUTES.brandSettings],
    [
      { destinationId: "SETTINGS_INTEGRATIONS" as const },
      AUTH_ROUTES.brandSettingsIntegrations,
    ],
    [
      { destinationId: "SETTINGS_BILLING" as const },
      AUTH_ROUTES.brandSettingsBilling,
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
    expect(() =>
      resolveChatNavigation({
        destinationId: "COLLABORATIONS",
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
      ChatNavigationSchema.safeParse({
        destinationId: "COLLABORATIONS",
        entityRef: {
          type: "COLLABORATION",
          id: CHAT_TEST_IDS.conversation,
        },
      }).success,
    ).toBe(true);
    expect(
      ChatNavigationSchema.safeParse({
        destinationId: "SETTINGS_INTEGRATIONS",
      }).success,
    ).toBe(true);
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
