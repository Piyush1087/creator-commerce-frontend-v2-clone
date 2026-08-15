import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";

import type { CampaignShellResponse } from "../contracts/brand-uce.contracts";
import { CampaignReadinessWorkspaceCard } from "./CampaignReadinessWorkspaceCard";

afterEach(cleanup);

const shell = {
  readiness: { ready: true, missing_requirements: [], reconciliation_required: false },
  workspace: {
    items: [
      { id: "applications", visible: true, available: true, priority: 2, count: 4 },
      { id: "discovery", visible: true, available: true, priority: 1, count: 0 },
      { id: "reporting", visible: true, available: false, priority: 4, count: 0, unavailable_message: "Reporting unavailable" },
      { id: "collaborations", visible: true, available: true, priority: 3, count: 1 },
    ],
  },
} as unknown as CampaignShellResponse;

function Probe() {
  const location = useLocation();
  return <output aria-label="location">{location.search}</output>;
}

function renderWorkspace(initialEntry = "/campaign/c1") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CampaignReadinessWorkspaceCard
        shell={shell}
        renderWorkspace={(workspace) => <p>Active workspace: {workspace}</p>}
      />
      <Probe />
    </MemoryRouter>,
  );
}

describe("Campaign workspace selection", () => {
  it("uses backend priority for the default and changes the composed workspace", async () => {
    renderWorkspace();
    expect(await screen.findByText("Active workspace: discovery")).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "Campaign workspaces" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "discovery · 0",
      "applications · 4",
      "collaborations · 1",
      "reporting · 0 · Reporting unavailable",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "applications · 4" }));
    expect(await screen.findByText("Active workspace: applications")).toBeTruthy();
    expect(screen.getByLabelText("location").textContent).toBe("?workspace=applications");
  });

  it("restores a valid route selection and falls back from an unavailable one", async () => {
    const first = renderWorkspace("/campaign/c1?workspace=collaborations");
    expect(await screen.findByText("Active workspace: collaborations")).toBeTruthy();
    first.unmount();
    renderWorkspace("/campaign/c1?workspace=reporting");
    expect(await screen.findByText("Active workspace: discovery")).toBeTruthy();
    expect((screen.getByRole("button", { name: /reporting/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
