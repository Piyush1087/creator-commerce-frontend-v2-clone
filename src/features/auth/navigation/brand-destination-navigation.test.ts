import { describe, expect, it } from "vitest";

import { BRAND_HOME_TEST_IDS } from "../../brand-dashboard/testing/brand-home-fixtures";
import { AUTH_ROUTES, collaborationsThreadUrl } from "../constants";
import {
  resolveBrandDestinationNavigation,
  UnsafeBrandDestinationError,
} from "./brand-destination-navigation";

describe("code-owned Brand destination navigation", () => {
  it.each([
    [{ destinationId: "HOME" as const }, AUTH_ROUTES.brandDashboard],
    [{ destinationId: "BRAND_CENTRE" as const }, AUTH_ROUTES.brandCentre],
    [
      {
        destinationId: "BRAND_CENTRE" as const,
        entityRef: { type: "BRAND" as const, id: BRAND_HOME_TEST_IDS.brand },
      },
      AUTH_ROUTES.brandCentre,
    ],
    [{ destinationId: "OFFERINGS" as const }, AUTH_ROUTES.brandCentreOfferings],
    [
      {
        destinationId: "OFFERINGS" as const,
        entityRef: {
          type: "OFFERING" as const,
          id: BRAND_HOME_TEST_IDS.offering,
        },
      },
      `/brand-centre/offerings/${BRAND_HOME_TEST_IDS.offering}`,
    ],
    [{ destinationId: "CAMPAIGNS" as const }, AUTH_ROUTES.brandUceCampaigns],
    [
      {
        destinationId: "CAMPAIGNS" as const,
        entityRef: {
          type: "CAMPAIGN" as const,
          id: BRAND_HOME_TEST_IDS.campaign,
        },
      },
      `/brand/uce/campaigns/${BRAND_HOME_TEST_IDS.campaign}`,
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
          id: BRAND_HOME_TEST_IDS.collaboration,
        },
      },
      collaborationsThreadUrl(BRAND_HOME_TEST_IDS.collaboration),
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
  ])("maps %o to an existing trusted route", (navigation, expected) => {
    expect(resolveBrandDestinationNavigation(navigation)).toBe(expected);
  });

  it("fails closed on mismatched entity semantics", () => {
    expect(() =>
      resolveBrandDestinationNavigation({
        destinationId: "COLLABORATIONS",
        entityRef: { type: "CAMPAIGN", id: BRAND_HOME_TEST_IDS.campaign },
      }),
    ).toThrow(UnsafeBrandDestinationError);
    expect(() =>
      resolveBrandDestinationNavigation({
        destinationId: "SETTINGS_BILLING",
        entityRef: { type: "BRAND", id: BRAND_HOME_TEST_IDS.brand },
      }),
    ).toThrow(UnsafeBrandDestinationError);
  });

  it.each(["//evil.example", "\\evil", "%2Fadmin", "campaign/id"])(
    "rejects hostile entity id %s without accepting an arbitrary URL",
    (id) => {
      expect(() =>
        resolveBrandDestinationNavigation({
          destinationId: "OFFERINGS",
          entityRef: { type: "OFFERING", id },
        }),
      ).toThrow(UnsafeBrandDestinationError);
    },
  );
});
