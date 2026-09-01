// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MarketplaceDetailResponse } from "../contracts/creator-campaigns.contracts";
import { readCreatorEntryContinuation } from "../../creator-onboarding/utils/creator-entry-continuation-session";
import { CampaignDetailWorkspace } from "./CampaignDetailWorkspace";

const mocks = vi.hoisted(() => ({ issue: vi.fn() }));
vi.mock("../../creator-onboarding/api/creator-entry-client", () => ({
  issueCampaignApplyContinuation: mocks.issue,
}));
vi.mock("../api/creator-campaigns-client", () => ({
  claimMarketplaceInvitation: vi.fn(),
  fetchMarketplaceAlternatives: vi.fn(),
  fetchMarketplaceShareLink: vi.fn(),
}));

const detail = {
  is_authenticated: false,
  ui_access_state: "teaser",
  already_applied: false,
  registration_cta: { label: "Create account to apply" },
  application_scope: null,
  campaign: {
    campaign_id: "campaign-1",
    campaign_name: "Synthetic campaign",
    brand_name: "Synthetic brand",
    brand_tagline: null,
    brand_slug: null,
    brand_logo_url: null,
    core_objective: "Awareness",
    execution_window: null,
    channels: [],
    creator_archetypes: [],
    compensation_teaser: null,
    product_image_url: null,
    product_name: "Product",
    product_retail_value: null,
  },
  brief_sections: [],
  match_score_percent: null,
  is_invited: false,
} as unknown as MarketplaceDetailResponse;

function renderCampaign(inviteToken?: string) {
  render(
    createElement(
      MemoryRouter,
      { initialEntries: ["/marketplace/campaigns/campaign-1"] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/marketplace/campaigns/campaign-1",
          element: createElement(CampaignDetailWorkspace, {
            detail,
            mode: "guest",
            inviteToken,
          }),
        }),
        createElement(Route, {
          path: "/creator/onboarding",
          element: createElement("p", null, "Creator Entry reached"),
        }),
        createElement(Route, {
          path: "/login",
          element: createElement("p", null, "Shared login reached"),
        }),
      ),
    ),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  mocks.issue.mockReset();
});
afterEach(cleanup);

describe("public Campaign Creator Entry continuation", () => {
  it("issues exactly once, stores the opaque token, and enters Creator Entry", async () => {
    let complete: ((value: unknown) => void) | undefined;
    mocks.issue.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    renderCampaign();
    const button = screen.getByRole("button", {
      name: "Create account to apply",
    });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.issue).toHaveBeenCalledTimes(1);
    complete?.({
      intent: "CAMPAIGN_APPLY",
      continuationToken: "A".repeat(43),
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
    expect(await screen.findByText("Creator Entry reached")).toBeTruthy();
    expect(readCreatorEntryContinuation()).toBe("A".repeat(43));
  });

  it("preserves invite-token Campaign-owned sign-in and does not issue a generic continuation", async () => {
    renderCampaign("invite-token");
    fireEvent.click(
      screen.getByRole("button", { name: "Create account to apply" }),
    );
    expect(await screen.findByText("Shared login reached")).toBeTruthy();
    expect(mocks.issue).not.toHaveBeenCalled();
    expect(readCreatorEntryContinuation()).toBeNull();
  });
});
