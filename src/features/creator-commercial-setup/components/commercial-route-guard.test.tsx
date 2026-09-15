// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { CreatorWorkspaceActorStateContext } from "../../../shared/creator/creator-workspace-actor-context-value";
import { CommercialRouteGuard } from "./commercial-route-guard";
import type { CreatorShellState } from "../../../layouts/app-shell/creator-shell-capabilities";
afterEach(cleanup);
describe("Commercial route canonical Team fence", () => {
  it("fails closed while unresolved", () => {
    render(
      <CommercialRouteGuard>
        <p>Private commercial fields</p>
      </CommercialRouteGuard>,
    );
    expect(screen.queryByText("Private commercial fields")).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });
  it("does not substitute another action for the commercial read grant", () => {
    const state = {
      status: "READY",
      actorContext: {
        workspaceId: "one",
        allowedActions: ["CREATOR_BRAND_READ"],
      },
    } as unknown as CreatorShellState;
    render(
      <CreatorWorkspaceActorStateContext.Provider value={state}>
        <CommercialRouteGuard>Private commercial fields</CommercialRouteGuard>
      </CreatorWorkspaceActorStateContext.Provider>,
    );
    expect(screen.queryByText("Private commercial fields")).toBeNull();
    expect(screen.getByRole("alert")).toBeTruthy();
  });
  it("admits explicit commercial read independent of source connection", () => {
    const state = {
      status: "READY",
      actorContext: {
        workspaceId: "one",
        allowedActions: ["COMMERCIAL_SETUP_READ"],
      },
    } as unknown as CreatorShellState;
    render(
      <CreatorWorkspaceActorStateContext.Provider value={state}>
        <CommercialRouteGuard>Private commercial fields</CommercialRouteGuard>
      </CreatorWorkspaceActorStateContext.Provider>,
    );
    expect(screen.getByText("Private commercial fields")).toBeTruthy();
  });
});
