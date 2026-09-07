// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  render: vi.fn(),
  download: vi.fn(),
}));
vi.mock("../api/c03-client", async (original) => ({
  ...(await original<typeof import("../api/c03-client")>()),
  fetchCreatorBriefPack: mocks.fetch,
}));
vi.mock("../pdf/creator-brief-pack", () => ({
  renderCreatorBriefPack: mocks.render,
  downloadCreatorBriefPack: mocks.download,
}));
import { CampaignError } from "../api/c03-client";
import { CampaignScope } from "../api/c03-scope";
import { ScopeContext } from "../hooks/campaign-scope-context";
import { BriefPackDownload } from "./BriefPackDownload";
import { briefPackFixture } from "../testing/brief-pack-fixture";
const scopes: CampaignScope[] = [];
afterEach(() => {
  cleanup();
  scopes.splice(0).forEach((s) => s.dispose());
  Object.values(mocks).forEach((m) => m.mockReset());
});
function setup() {
  const scope = new CampaignScope();
  scopes.push(scope);
  render(
    createElement(
      ScopeContext.Provider,
      { value: scope },
      createElement(BriefPackDownload, {
        applicationId: briefPackFixture().application.applicationId,
      }),
    ),
  );
  return scope;
}
it("announces progress and success and suppresses duplicate clicks", async () => {
  let finish!: (value: ReturnType<typeof briefPackFixture>) => void;
  mocks.fetch.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  mocks.render.mockReturnValue({ filename: "fixture.pdf" });
  mocks.download.mockResolvedValue(undefined);
  setup();
  const button = screen.getByRole("button", { name: "Download Brief" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(button.getAttribute("aria-busy")).toBe("true");
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status").textContent).toContain("Loading");
  finish(briefPackFixture());
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain("downloaded"),
  );
  expect(mocks.download).toHaveBeenCalledTimes(1);
});
it.each([
  [401, null, "session ended"],
  [403, null, "access changed"],
  [404, "APPLICATION_NOT_FOUND", "unavailable"],
  [409, "APPLICATION_BRIEF_PACK_UNAVAILABLE", "historical downloadable"],
  [502, null, "could not be verified"],
  [0, null, "could not be verified"],
] as const)("bounds error %s", async (status, code, copy) => {
  mocks.fetch.mockRejectedValue(new CampaignError(status, code));
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Download Brief" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(copy),
  );
  expect(mocks.download).not.toHaveBeenCalled();
});
it("bounds PDF failures and rejects a late pack after authority clearing", async () => {
  mocks.fetch.mockResolvedValue(briefPackFixture());
  mocks.render.mockImplementation(() => {
    throw Error("RAW_DIAGNOSTIC");
  });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Download Brief" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "PDF could not be created",
    ),
  );
  expect(document.body.textContent).not.toContain("RAW_DIAGNOSTIC");
  cleanup();
  let finish!: (value: ReturnType<typeof briefPackFixture>) => void;
  mocks.fetch.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  const scope = setup();
  fireEvent.click(screen.getByRole("button", { name: "Download Brief" }));
  scope.clear();
  finish(briefPackFixture());
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(mocks.download).not.toHaveBeenCalled();
});
