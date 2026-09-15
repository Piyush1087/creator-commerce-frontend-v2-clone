// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorBrandWorkspace } from "./creator-brand-workspace";
import { CreatorBrandRouteGuard } from "./creator-brand-route-guard";
import { CreatorWorkspaceActorStateContext } from "../../../shared/creator/creator-workspace-actor-context-value";
import {
  creatorBrandFixture,
  supportedFixture,
} from "../testing/creator-brand.fixture";
import { candidateDraft } from "./creator-brand-fields";
import { emptyCreatorBrandProfile } from "../contracts/creator-brand-profile.contract";
const mock = vi.hoisted(() => ({ hook: vi.fn() }));
vi.mock("../hooks/use-creator-brand", () => ({ useCreatorBrand: mock.hook }));
afterEach(cleanup);
let state: ReturnType<typeof hookState>;
function hookState() {
  return {
    data: creatorBrandFixture(),
    loading: false,
    error: null as string | null,
    pending: false,
    conflict: false,
    announcement: "",
    retry: vi.fn(),
    submit: vi.fn().mockResolvedValue(true),
    reviewed: vi.fn(),
  };
}
beforeEach(() => {
  state = hookState();
  mock.hook.mockImplementation(() => state);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
});
function workspace() {
  return render(
    <MemoryRouter>
      <CreatorBrandWorkspace />
    </MemoryRouter>,
  );
}
describe("Creator Brand workspace", () => {
  it("initial loading does not fabricate setup or canonical values", () => {
    state.data = null as unknown as typeof state.data;
    state.loading = true;
    workspace();
    expect(screen.getByText("Loading Creator Brand…")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Set up/ })).toBeNull();
    expect(state.submit).not.toHaveBeenCalled();
  });
  it("first error offers retry without fabricating a profile", () => {
    state.data = null as unknown as typeof state.data;
    state.error = "Creator Brand could not be loaded.";
    workspace();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(state.retry).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /Set up/ })).toBeNull();
  });
  it("pending manual submission disables all draft mutation controls", () => {
    const rendered = workspace();
    fireEvent.click(screen.getByRole("button", { name: /Set up/ }));
    state.pending = true;
    rendered.rerender(
      <MemoryRouter>
        <CreatorBrandWorkspace />
      </MemoryRouter>,
    );
    expect(
      screen
        .getByRole("button", { name: "Save Creator Brand" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Cancel" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByLabelText("Headline / Positioning").closest("fieldset")
        ?.disabled,
    ).toBe(true);
  });
  it("revision conflict preserves draft and requires canonical review", async () => {
    const rendered = workspace();
    fireEvent.click(screen.getByRole("button", { name: /Set up/ }));
    fireEvent.change(screen.getByLabelText("Headline / Positioning"), {
      target: { value: "Unsaved conflict draft" },
    });
    state.conflict = true;
    state.error = "Review latest confirmed values.";
    state.data = creatorBrandFixture("OWNER", true);
    rendered.rerender(
      <MemoryRouter>
        <CreatorBrandWorkspace />
      </MemoryRouter>,
    );
    expect(
      (screen.getByLabelText("Headline / Positioning") as HTMLTextAreaElement)
        .value,
    ).toBe("Unsaved conflict draft");
    expect(
      screen
        .getByRole("button", { name: "Save Creator Brand" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getByText("Confirmed positioning")).toBeTruthy();
    expect(screen.getByText(/Cancel this draft/)).toBeTruthy();
  });
  it.each(["USE_SUGGESTION", "EDIT_SUGGESTION"] as const)(
    "%s failure preserves retry identity and confirmed values",
    async (intent) => {
      state.data = supportedFixture();
      state.submit.mockResolvedValue(false);
      workspace();
      if (intent === "EDIT_SUGGESTION") {
        fireEvent.click(
          screen.getByRole("button", {
            name: "Edit Headline / Positioning before using",
          }),
        );
        fireEvent.change(screen.getByLabelText("Headline / Positioning"), {
          target: { value: "Creator edited positioning" },
        });
      }
      const button =
        intent === "USE_SUGGESTION"
          ? screen.getByRole("button", {
              name: "Use suggestion for Headline / Positioning",
            })
          : screen.getByRole("button", { name: "Save Creator Brand" });
      fireEvent.click(button);
      await waitFor(() => expect(state.submit).toHaveBeenCalledTimes(1));
      fireEvent.click(button);
      await waitFor(() => expect(state.submit).toHaveBeenCalledTimes(2));
      expect(state.submit.mock.calls[0][0].intent).toBe(intent);
      expect(state.submit.mock.calls[1][0]).toEqual(
        state.submit.mock.calls[0][0],
      );
      expect(screen.getByText("Confirmed positioning")).toBeTruthy();
    },
  );
  it.each(["OWNER", "MANAGER"] as const)(
    "%s has no-source manual setup",
    (role) => {
      state.data = creatorBrandFixture(role);
      workspace();
      expect(
        screen.getByRole("button", { name: /Set up Creator Brand/ }),
      ).toBeTruthy();
      expect(screen.getByText("No connected Instagram handle")).toBeTruthy();
      expect(state.submit).not.toHaveBeenCalled();
    },
  );
  it("Assistant reads but has no mutation controls", () => {
    state.data = creatorBrandFixture("ASSISTANT", true);
    workspace();
    expect(screen.getByText("Confirmed positioning")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Edit Creator Brand" }),
    ).toBeNull();
  });
  it("allowed actions override role labels", () => {
    state.data.context.allowedActions = ["CREATOR_BRAND_READ"];
    workspace();
    expect(screen.queryByRole("button", { name: /Set up/ })).toBeNull();
  });
  it("configured canonical read first", () => {
    state.data = creatorBrandFixture("OWNER", true);
    workspace();
    expect(
      screen.getByRole("button", { name: "Edit Creator Brand" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
  it("manual save sends full values, revision and UUID", async () => {
    workspace();
    fireEvent.click(screen.getByRole("button", { name: /Set up/ }));
    fireEvent.change(screen.getByLabelText("Headline / Positioning"), {
      target: { value: "Manual headline" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Creator Brand" }));
    await waitFor(() => expect(state.submit).toHaveBeenCalledOnce());
    expect(state.submit.mock.calls[0][0]).toMatchObject({
      intent: "MANUAL",
      expectedRevision: 0,
      values: { headline: "Manual headline" },
    });
    expect(state.submit.mock.calls[0][0].idempotencyKey).toMatch(
      /^[a-f0-9-]{36}$/,
    );
  });
  it("cancel makes no PUT", () => {
    workspace();
    fireEvent.click(screen.getByRole("button", { name: /Set up/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(state.submit).not.toHaveBeenCalled();
  });
  it("retry preserves key and draft after error; changed draft changes key", async () => {
    state.submit.mockResolvedValue(false);
    workspace();
    fireEvent.click(screen.getByRole("button", { name: /Set up/ }));
    fireEvent.change(screen.getByLabelText("Headline / Positioning"), {
      target: { value: "Draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Creator Brand" }));
    await waitFor(() => expect(state.submit).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Save Creator Brand" }));
    await waitFor(() => expect(state.submit).toHaveBeenCalledTimes(2));
    expect(state.submit.mock.calls[0][0].idempotencyKey).toBe(
      state.submit.mock.calls[1][0].idempotencyKey,
    );
    expect(
      (screen.getByLabelText("Headline / Positioning") as HTMLTextAreaElement)
        .value,
    ).toBe("Draft");
    fireEvent.change(screen.getByLabelText("Headline / Positioning"), {
      target: { value: "Changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Creator Brand" }));
    await waitFor(() => expect(state.submit).toHaveBeenCalledTimes(3));
    expect(state.submit.mock.calls[2][0].idempotencyKey).not.toBe(
      state.submit.mock.calls[1][0].idempotencyKey,
    );
  });
  it("USE submits exact reference only", async () => {
    state.data = supportedFixture();
    workspace();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Use suggestion for Headline / Positioning",
      }),
    );
    await waitFor(() => expect(state.submit).toHaveBeenCalledOnce());
    expect(state.submit.mock.calls[0][0]).not.toHaveProperty("values");
    expect(state.submit.mock.calls[0][0].intent).toBe("USE_SUGGESTION");
  });
  it("EDIT permits target only and preserves Bio", async () => {
    state.data = supportedFixture();
    workspace();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Headline / Positioning before using",
      }),
    );
    expect(screen.queryByLabelText("Commercial Bio")).toBeNull();
    fireEvent.change(screen.getByLabelText("Headline / Positioning"), {
      target: { value: "Edited" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Creator Brand" }));
    await waitFor(() => expect(state.submit).toHaveBeenCalledOnce());
    expect(state.submit.mock.calls[0][0]).toMatchObject({
      intent: "EDIT_SUGGESTION",
      values: { headline: "Edited", commercialBio: "Manual bio" },
    });
  });
  it.each(["STALE", "DEGRADED"] as const)(
    "%s suggestions cannot confirm; manual remains",
    (status) => {
      state.data = supportedFixture();
      state.data.suggestions.state = status;
      workspace();
      expect(
        screen.queryByRole("button", { name: /Use suggestion/ }),
      ).toBeNull();
      expect(
        screen.getByRole("button", { name: "Edit Creator Brand" }),
      ).toBeTruthy();
    },
  );
  it("already-reflected candidate has no redundant action", () => {
    state.data = supportedFixture();
    state.data.profile!.headline = "Suggested positioning";
    workspace();
    expect(
      screen.getByText("Already reflected in confirmed values."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Use suggestion/ })).toBeNull();
  });
  it("palette words do not become hex or controls", () => {
    state.data = supportedFixture();
    const candidate = {
      ...state.data.suggestions.families.positioning.candidates[0],
      field: "paletteCue" as const,
      value: { kind: "COLOR_WORDS" as const, words: ["green"] },
      confirmable: false,
    };
    state.data.suggestions.families.visual_identity = {
      availability: "AVAILABLE",
      candidates: [candidate],
    };
    expect(candidateDraft(emptyCreatorBrandProfile(), candidate)).toBeNull();
    workspace();
    expect(screen.getByText("green")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /Use suggestion for Palette/ }),
    ).toBeNull();
  });
  it("last-good confirmed truth survives load error", () => {
    state.data = creatorBrandFixture("OWNER", true);
    state.error = "Transport failed";
    workspace();
    expect(screen.getByText("Confirmed positioning")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Edit Creator Brand" }),
    ).toBeTruthy();
  });
  it("does not expose internal references or identity editing", () => {
    state.data = supportedFixture();
    const { container } = workspace();
    expect(container.textContent).not.toContain("a".repeat(64));
    expect(container.textContent).not.toContain(
      state.data.suggestions.objectGenerationId,
    );
    expect(screen.queryByLabelText("Creator name")).toBeNull();
    expect(screen.queryByLabelText("Instagram handle")).toBeNull();
  });
});
describe("source-independent Creator Brand projection guard", () => {
  it("waits while context loads", () => {
    render(
      <CreatorWorkspaceActorStateContext.Provider
        value={{ status: "LOADING", actorContext: null }}
      >
        <CreatorBrandRouteGuard>Protected</CreatorBrandRouteGuard>
      </CreatorWorkspaceActorStateContext.Provider>,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByText("Protected")).toBeNull();
  });
  it("denies unverified membership", () => {
    render(
      <CreatorWorkspaceActorStateContext.Provider
        value={{ status: "RECOVERY", actorContext: null, reason: "Denied" }}
      >
        <CreatorBrandRouteGuard>Protected</CreatorBrandRouteGuard>
      </CreatorWorkspaceActorStateContext.Provider>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });
  it.each(["OWNER", "MANAGER", "ASSISTANT"] as const)(
    "admits active %s with READ and no source fields",
    (role) => {
      render(
        <CreatorWorkspaceActorStateContext.Provider
          value={{
            status: "READY",
            actorContext: {
              actorUserId: "actor",
              actorMembershipId: "membership",
              actorRole: role,
              workspaceId: "workspace",
              organizationId: "org",
              subjectCreatorProfileId: "canonical-owner-profile",
              subjectOwnerUserId: "canonical-owner-user",
              allowedActions: ["CREATOR_BRAND_READ"],
            },
          }}
        >
          <CreatorBrandRouteGuard>Protected</CreatorBrandRouteGuard>
        </CreatorWorkspaceActorStateContext.Provider>,
      );
      expect(screen.getByText("Protected")).toBeTruthy();
    },
  );
});
