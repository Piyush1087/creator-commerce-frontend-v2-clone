// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioWorkspace } from "./portfolio-workspace";
import { CreatorWorkspaceActorStateContext } from "../../../shared/creator/creator-workspace-actor-context-value";
import {
  manualItem,
  portfolioActor,
  portfolioFixture,
} from "../testing/portfolio.fixture";
import { usePortfolio } from "../hooks/use-portfolio";
vi.mock("../hooks/use-portfolio", () => ({ usePortfolio: vi.fn() }));
function state() {
  return {
    data: portfolioFixture("OWNER", [manualItem()]),
    loading: false,
    pending: false,
    error: null as string | null,
    conflict: false,
    announcement: "",
    reload: vi.fn(),
    submit: vi.fn().mockResolvedValue(true),
    loadMore: vi.fn(),
    reviewed: vi.fn(),
  };
}
let model: ReturnType<typeof state>;
beforeEach(() => {
  vi.clearAllMocks();
  model = state();
  vi.mocked(usePortfolio).mockImplementation(() => model);
});
afterEach(cleanup);
const workspace = (role: "OWNER" | "MANAGER" | "ASSISTANT" = "OWNER") =>
  render(
    <CreatorWorkspaceActorStateContext.Provider value={portfolioActor(role)}>
      <PortfolioWorkspace />
    </CreatorWorkspaceActorStateContext.Provider>,
  );
describe("Portfolio frozen view and actions", () => {
  it("shows exact five filters, named source link and no preview/media controls", () => {
    workspace();
    expect(
      screen.getByRole("navigation", { name: "Portfolio filters" }).textContent,
    ).toBe("AllInstagramCreator ShopAdded by meRemoved");
    expect(
      screen
        .getByRole("link", { name: "Open original work: Example work" })
        .getAttribute("rel"),
    ).toBe("noopener noreferrer");
    expect(
      document.querySelector("video,iframe,img,input[type=file]"),
    ).toBeNull();
  });
  it.each(["OWNER", "MANAGER"] as const)(
    "%s can add/edit/remove pure manual references",
    (role) => {
      model.data = portfolioFixture(role, [manualItem()]);
      workspace(role);
      expect(
        screen.getByRole("button", { name: "Add work reference" }),
      ).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Remove Example work" }),
      );
      expect(model.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: "REMOVE",
          itemId: manualItem().id,
          expectedRevision: 0,
        }),
      );
    },
  );
  it("Assistant sees work but no curation", () => {
    model.data = portfolioFixture("ASSISTANT", [manualItem()]);
    workspace("ASSISTANT");
    expect(screen.getByText("Example work")).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: /Add work|Remove Example|Edit Example/,
      }),
    ).toBeNull();
  });
  it("keeps verification distinct and forbids editing sourced facts", () => {
    const item = {
      ...manualItem(),
      kind: "INSTAGRAM_REEL" as const,
      destination: "https://www.instagram.com/reel/fixture/",
      provenance: [
        {
          source: "INSTAGRAM" as const,
          classification: "POSSIBLE_COLLABORATION" as const,
          confidence: "LOW" as const,
          observedAt: "2026-09-16T00:00:00.000Z",
          basis: "SPONSORSHIP_DISCLOSURE" as const,
        },
        {
          source: "CREATOR_SHOP" as const,
          verification: "COMPLETED_WORK" as const,
          verifiedAt: "2026-09-16T00:00:00.000Z",
        },
      ],
    };
    model.data = portfolioFixture("OWNER", [item]);
    workspace();
    expect(
      screen.getByText(/Instagram Verified · Possible Collaboration/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Creator Shop Verified · Completed work/),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Edit Example work" }),
    ).toBeNull();
  });
  it.each(["AVAILABLE", "PARTIAL", "UNAVAILABLE", "NOT_PROCESSED"] as const)(
    "truthfully renders empty source %s",
    (discovery) => {
      model.data = { ...portfolioFixture(), discovery };
      workspace();
      expect(screen.getByText("No work in this view")).toBeTruthy();
      expect(model.submit).not.toHaveBeenCalled();
    },
  );
  it("loading/error don't fabricate candidate; transient error retains confirmed work", () => {
    model.loading = true;
    model.data = null as unknown as typeof model.data;
    model.error = "Unavailable";
    const view = workspace();
    expect(screen.getByText("Loading Portfolio…")).toBeTruthy();
    expect(screen.queryByText("Example work")).toBeNull();
    model.loading = false;
    model.data = portfolioFixture("OWNER", [manualItem()]);
    view.rerender(
      <CreatorWorkspaceActorStateContext.Provider value={portfolioActor()}>
        <PortfolioWorkspace />
      </CreatorWorkspaceActorStateContext.Provider>,
    );
    expect(screen.getByText("Last confirmed work is shown")).toBeTruthy();
    expect(screen.getByText("Example work")).toBeTruthy();
  });
  it("Removed supports Restore and exact filter selection", () => {
    model.data = portfolioFixture("OWNER", [
      { ...manualItem(), state: "REMOVED" },
    ]);
    workspace();
    fireEvent.click(screen.getByRole("button", { name: "Removed" }));
    expect(usePortfolio).toHaveBeenLastCalledWith("REMOVED");
    fireEvent.click(
      screen.getByRole("button", { name: "Restore Example work" }),
    );
    expect(model.submit).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "RESTORE" }),
    );
  });
  it("form validates link, retains unsaved draft on failure and submits stable retry key", async () => {
    model.submit.mockResolvedValue(false);
    workspace();
    fireEvent.click(screen.getByRole("button", { name: "Add work reference" }));
    fireEvent.change(screen.getByLabelText("Work title"), {
      target: { value: "New work" },
    });
    fireEvent.change(screen.getByLabelText("Original work link"), {
      target: { value: "https://example.com/new" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save work reference" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("Work was not saved. Your fields are preserved."),
      ).toBeTruthy(),
    );
    const first = model.submit.mock.calls[0][0];
    fireEvent.click(
      screen.getByRole("button", { name: "Save work reference" }),
    );
    await waitFor(() => expect(model.submit).toHaveBeenCalledTimes(2));
    expect(model.submit.mock.calls[1][0]).toEqual(first);
    expect(
      (screen.getByLabelText("Work title") as HTMLInputElement).value,
    ).toBe("New work");
  });
  it("fails closed without active membership", () => {
    render(
      <CreatorWorkspaceActorStateContext.Provider
        value={{ status: "RECOVERY", actorContext: null, reason: "Inactive" }}
      >
        <PortfolioWorkspace />
      </CreatorWorkspaceActorStateContext.Provider>,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "access could not be verified",
    );
    expect(usePortfolio).not.toHaveBeenCalled();
  });
});
