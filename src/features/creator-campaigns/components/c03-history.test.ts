// @vitest-environment jsdom
import { createElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const api = vi.hoisted(() => ({
  detail: vi.fn(),
  withdraw: vi.fn(),
  notifications: vi.fn(),
  unread: vi.fn(),
  read: vi.fn(),
}));
vi.mock("../api/c03-client", async (original) => ({
  ...(await original<typeof import("../api/c03-client")>()),
  fetchApplication: api.detail,
  withdrawApplication: api.withdraw,
  fetchNotifications: api.notifications,
  fetchUnread: api.unread,
  markRead: api.read,
}));
import { CreatorWorkspaceActorStateContext } from "../../../shared/creator/creator-workspace-actor-context-value";
import type { CreatorWorkspaceActorContext } from "../../../shared/creator/creator-workspace-actor.contract";
import { ScopedCampaigns } from "./CampaignAuthority";
import { ApplicationWorkspace } from "./ApplicationWorkspace";
import { CreatorNotifications } from "./CreatorNotifications";
import {
  applicationFixture,
  fixtureId,
  receiptFixture,
} from "../testing/c03-fixtures";
import { invalidateCampaignScopes } from "../api/c03-scope";
function actor(
  role: CreatorWorkspaceActorContext["actorRole"],
): CreatorWorkspaceActorContext {
  return {
    actorUserId: role === "OWNER" ? "owner" : "member",
    actorMembershipId: "membership",
    actorRole: role,
    workspaceId: "workspace",
    organizationId: "org",
    subjectCreatorProfileId: "profile",
    subjectOwnerUserId: "owner",
    allowedActions: [
      "CAMPAIGN_OPPORTUNITY_VIEW",
      "CAMPAIGN_APPLICATION_APPLY",
      ...(role === "ASSISTANT"
        ? []
        : ["CAMPAIGN_APPLICATION_WITHDRAW_PENDING" as const]),
    ],
  };
}
afterEach(() => {
  cleanup();
  invalidateCampaignScopes();
  Object.values(api).forEach((mock) => mock.mockReset());
});
function renderHistory(role: CreatorWorkspaceActorContext["actorRole"]) {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [`/applications/${fixtureId(100)}`] },
      createElement(
        CreatorWorkspaceActorStateContext.Provider,
        { value: { status: "READY", actorContext: actor(role) } },
        createElement(ScopedCampaigns, {
          children: createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/applications/:applicationId",
              element: createElement(ApplicationWorkspace),
            }),
          ),
        }),
      ),
    ),
  );
}
it.each(["OWNER", "MANAGER", "ASSISTANT"] as const)(
  "%s reads immutable history; only authorized actors can Withdraw",
  async (role) => {
    api.detail.mockResolvedValue({
      ...applicationFixture(),
      canWithdrawPending: role !== "ASSISTANT",
    });
    renderHistory(role);
    await screen.findByText(
      "These details were recorded when this Application was submitted.",
    );
    expect(
      screen.queryByRole("button", { name: "Withdraw Application" }) !== null,
    ).toBe(role !== "ASSISTANT");
    expect(
      screen.getByText(
        "Show an authentic everyday moment with clear disclosure.",
      ),
    ).toBeTruthy();
    if (role !== "ASSISTANT") {
      fireEvent.click(
        screen.getByRole("button", { name: "Withdraw Application" }),
      );
      await waitFor(() =>
        expect(document.activeElement).toBe(
          screen.getByRole("button", { name: "Keep Application" }),
        ),
      );
      expect(api.withdraw).not.toHaveBeenCalled();
      api.withdraw.mockResolvedValue({
        ...receiptFixture,
        status: "WITHDRAWN",
      });
      api.detail.mockResolvedValue(applicationFixture("WITHDRAWN"));
      fireEvent.click(screen.getByRole("button", { name: "Confirm Withdraw" }));
      await screen.findByText("Withdraw confirmed by the server.");
      expect(api.withdraw).toHaveBeenCalledTimes(1);
    }
  },
);
it("approved lineage gives the exact C04 link without reconstructing current Campaign data", async () => {
  api.detail.mockResolvedValue(applicationFixture("APPROVED"));
  renderHistory("ASSISTANT");
  expect(
    (
      await screen.findByRole("link", { name: "Open Collaboration" })
    ).getAttribute("href"),
  ).toBe(`/creator/collaborations?thread=${fixtureId(200)}`);
  expect(
    screen.queryByRole("button", { name: "Withdraw Application" }),
  ).toBeNull();
});
it("notification list remains readable when unread count fails; read is server-confirmed", async () => {
  api.unread.mockRejectedValue(new Error("unavailable"));
  const notification = {
    id: fixtureId(700),
    event_type: "campaigns.application_rejected",
    created_at: "2030-09-01T00:00:00.000Z",
    payload: { application_id: fixtureId(100) },
    is_read: false,
  };
  api.notifications.mockResolvedValue({ notifications: [notification] });
  api.read.mockResolvedValue({});
  render(
    createElement(
      MemoryRouter,
      null,
      createElement(
        CreatorWorkspaceActorStateContext.Provider,
        { value: { status: "READY", actorContext: actor("ASSISTANT") } },
        createElement(CreatorNotifications),
      ),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));
  await screen.findByText("Application rejected");
  expect(screen.getByText("Unread count unavailable")).toBeTruthy();
  api.notifications.mockResolvedValue({
    notifications: [{ ...notification, is_read: true }],
  });
  fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
  await screen.findByText("Notification marked as read.");
  expect(api.read).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("link", { name: "View Application" }).getAttribute("href"),
  ).toBe(`/creator/campaigns/applications/${fixtureId(100)}`);
});
