// @vitest-environment jsdom

import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  autosaveCanonicalCampaignField: vi.fn().mockResolvedValue(undefined),
  createCanonicalCampaignDraft: vi.fn().mockResolvedValue({ campaignId: "campaign-1" }),
  fetchCanonicalCampaignDraft: vi.fn(),
  fetchCanonicalCampaignReadiness: vi.fn(),
  publishCanonicalCampaignDraft: vi.fn(),
}));

vi.mock("../api/canonical-campaign-draft-client", () => api);

import { CreateCampaignWizard } from "./CreateCampaignWizard";

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("CreateCampaignWizard autosave lifecycle", () => {
  it("keeps field PATCH autosave active after the Strict Mode effect probe", async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <CreateCampaignWizard />
        </MemoryRouter>
      </StrictMode>,
    );

    expect(api.autosaveCanonicalCampaignField).not.toHaveBeenCalled();
    const campaignName = await screen.findByLabelText(/Campaign Name/i);
    fireEvent.change(campaignName, { target: { value: "Strict" } });
    fireEvent.change(campaignName, { target: { value: "Strict Mode Campaign" } });
    fireEvent.blur(campaignName);

    await waitFor(
      () => expect(api.autosaveCanonicalCampaignField).toHaveBeenCalledWith(
        "campaign-1",
        "strategy.campaign_name",
        "Strict Mode Campaign",
      ),
      { timeout: 1_500 },
    );
    expect(api.autosaveCanonicalCampaignField).toHaveBeenCalledTimes(1);
  });

  it("sends an objective selection immediately through the canonical field endpoint", async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <CreateCampaignWizard />
        </MemoryRouter>
      </StrictMode>,
    );

    fireEvent.click(await screen.findByRole("radio", { name: /Awareness/i }));

    await waitFor(() => expect(api.autosaveCanonicalCampaignField).toHaveBeenCalledWith(
      "campaign-1",
      "strategy.objective",
      "AWARENESS",
    ));
    expect(api.autosaveCanonicalCampaignField).toHaveBeenCalledTimes(1);
  });
});
