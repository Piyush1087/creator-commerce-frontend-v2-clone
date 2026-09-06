// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolvePublicInvitation } from "../../../features/creator-campaigns/api/public-marketplace-client";
import { PublicInviteLandingPage } from "./public-invite-landing-page";

vi.mock(
  "../../../features/creator-campaigns/api/public-marketplace-client",
  () => ({ resolvePublicInvitation: vi.fn() }),
);

function LocationTarget() {
  const location = useLocation();
  return createElement(
    "p",
    null,
    `Destination: ${location.pathname}${location.search}`,
  );
}

function mount(token = "safe_token-123") {
  render(
    createElement(
      MemoryRouter,
      { initialEntries: [`/marketplace/invite/${token}`] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/marketplace/invite/:token",
          element: createElement(PublicInviteLandingPage),
        }),
        createElement(Route, {
          path: "/marketplace/*",
          element: createElement(LocationTarget),
        }),
      ),
    ),
  );
}

beforeEach(() => vi.mocked(resolvePublicInvitation).mockReset());
afterEach(cleanup);

describe("public invitation navigation", () => {
  it("builds an encoded, internal Campaign destination", async () => {
    vi.mocked(resolvePublicInvitation).mockResolvedValueOnce({
      invitation_token: "safe_token-123",
      collaboration_id: "collaboration-1",
      campaign_id: "11111111-1111-4111-8111-111111111111",
      campaign_name: "Synthetic campaign",
      application_scope: null,
      instagram_handle: "synthetic_creator",
      collab_status: "INVITED",
      is_claimable: true,
    });
    mount();
    expect(
      await screen.findByText(
        "Destination: /marketplace/11111111-1111-4111-8111-111111111111?invite_token=safe_token-123",
      ),
    ).toBeTruthy();
  });

  it("falls back to Marketplace when the resolved identifier is unsafe", async () => {
    vi.mocked(resolvePublicInvitation).mockResolvedValueOnce({
      invitation_token: "safe_token-123",
      collaboration_id: "collaboration-1",
      campaign_id: "//evil.example",
      campaign_name: "Synthetic campaign",
      application_scope: null,
      instagram_handle: "synthetic_creator",
      collab_status: "INVITED",
      is_claimable: true,
    });
    mount();
    expect(await screen.findByText("Destination: /marketplace")).toBeTruthy();
    expect(window.location.href).not.toContain("evil.example");
  });
});
