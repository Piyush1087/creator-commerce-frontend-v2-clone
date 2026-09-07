// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreatorWorkspaceActorProvider } from "./creator-workspace-actor-context";
import { useCreatorWorkspaceActorState } from "./creator-workspace-actor-context-value";
import { toCreatorWorkspaceActorContext } from "./creator-workspace-actor-mapper";

const mocks = vi.hoisted(() => ({ fetchActor: vi.fn() }));

vi.mock("../../features/settings/api/creator-team-client", () => ({
  fetchCreatorWorkspaceActorContext: mocks.fetchActor,
}));

const response = {
  actor_user_id: "manager-user",
  actor_membership_id: "manager-membership",
  actor_role: "MANAGER" as const,
  workspace_id: "workspace-1",
  organization_id: "organization-1",
  subject_creator_profile_id: "creator-profile-1",
  subject_owner_user_id: "owner-user",
  allowed_actions: [
    "WORKSPACE_PROFILE_READ",
    "TEAM_READ",
    "INSTAGRAM_SETTINGS_READ",
    "PAYOUT_SETTINGS_READ",
  ] as const,
};

function ActorStateProbe() {
  const state = useCreatorWorkspaceActorState();
  return createElement(
    "output",
    null,
    state?.status === "READY"
      ? `READY:${state.actorContext.actorUserId}:${state.actorContext.actorRole}`
      : (state?.status ?? "DISABLED"),
  );
}

function renderProvider(actorUserId = "manager-user") {
  return render(
    createElement(
      CreatorWorkspaceActorProvider,
      { enabled: true, actorUserId },
      createElement(ActorStateProbe),
    ),
  );
}

beforeEach(() => mocks.fetchActor.mockReset());
afterEach(cleanup);

describe("Creator workspace actor context convergence", () => {
  it("stays disabled and performs no Creator request for another role", () => {
    render(
      createElement(
        CreatorWorkspaceActorProvider,
        { enabled: false, actorUserId: "brand-user" },
        createElement(ActorStateProbe),
      ),
    );
    expect(screen.getByText("DISABLED")).toBeTruthy();
    expect(mocks.fetchActor).not.toHaveBeenCalled();
  });

  it("projects pending to LOADING and a validated response to READY", async () => {
    mocks.fetchActor.mockResolvedValue(response);
    renderProvider();

    expect(screen.getByText("LOADING")).toBeTruthy();
    expect(await screen.findByText("READY:manager-user:MANAGER")).toBeTruthy();
    expect(mocks.fetchActor).toHaveBeenCalledTimes(1);
  });

  it("fails a denied membership projection into RECOVERY", async () => {
    mocks.fetchActor.mockResolvedValue({
      ...response,
      actor_membership_id: "",
    });
    renderProvider();

    expect(await screen.findByText("RECOVERY")).toBeTruthy();
    expect(screen.queryByText(/READY:/)).toBeNull();
  });

  it("fails inconsistent direct identity closed", async () => {
    mocks.fetchActor.mockResolvedValue({
      ...response,
      actor_user_id: "different-user",
    });
    renderProvider();

    expect(await screen.findByText("RECOVERY")).toBeTruthy();
  });

  it("does not infer authority or accept unknown backend actions", () => {
    expect(
      toCreatorWorkspaceActorContext(
        {
          ...response,
          allowed_actions: ["TEAM_READ", "UNKNOWN_ACTION"],
        } as never,
        "manager-user",
      ),
    ).toBeNull();
  });

  it("returns to LOADING immediately when the authenticated User changes", async () => {
    let resolveSecond: ((value: typeof response) => void) | undefined;
    mocks.fetchActor.mockResolvedValueOnce(response).mockImplementationOnce(
      () =>
        new Promise<typeof response>((resolve) => {
          resolveSecond = resolve;
        }),
    );
    const view = renderProvider();
    expect(await screen.findByText("READY:manager-user:MANAGER")).toBeTruthy();

    view.rerender(
      createElement(
        CreatorWorkspaceActorProvider,
        { enabled: true, actorUserId: "second-user" },
        createElement(ActorStateProbe),
      ),
    );
    expect(screen.getByText("LOADING")).toBeTruthy();
    resolveSecond?.({
      ...response,
      actor_user_id: "second-user",
    });
    expect(await screen.findByText("READY:second-user:MANAGER")).toBeTruthy();
  });
});
