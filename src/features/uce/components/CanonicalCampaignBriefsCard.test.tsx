import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CanonicalCampaignBriefsCard } from "./CanonicalCampaignBriefsCard";

afterEach(() => vi.restoreAllMocks());

const asset = {
  campaign_asset_id: "a1",
  kind: "OFFERING" as const,
  status: "ACTIVE" as const,
  entity_id: "o1",
  label: "Serum",
  subtype: "PRODUCT",
  image_url: null,
};

describe("CanonicalCampaignBriefsCard", () => {
  it("does not infer Asset ownership before explicit selection", () => {
    render(
      <CanonicalCampaignBriefsCard
        campaignId="c1"
        assets={[asset]}
        briefs={[]}
        canCreate
        onCreated={vi.fn()}
      />,
    );
    expect(
      (screen.getByText("Create Brief") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Campaign Asset") as HTMLSelectElement).value,
    ).toBe("");
  });

  it("submits deliverables under the exact selected Asset", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ brief_id: "b1" }), { status: 200 }),
      );
    const onCreated = vi.fn().mockResolvedValue(undefined);
    render(
      <CanonicalCampaignBriefsCard
        campaignId="c1"
        assets={[asset]}
        briefs={[]}
        canCreate
        onCreated={onCreated}
      />,
    );
    fireEvent.change(screen.getByLabelText("Campaign Asset"), {
      target: { value: "a1" },
    });
    fireEvent.change(screen.getByLabelText("Brief title"), {
      target: { value: "Creator launch brief" },
    });
    fireEvent.change(screen.getByLabelText("Creative requirements"), {
      target: { value: "Show the product clearly in daylight." },
    });
    fireEvent.change(screen.getByLabelText("Deliverable format"), {
      target: { value: "Instagram Reel" },
    });
    fireEvent.click(screen.getByText("Create Brief"));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/campaigns/c1/canonical-briefs"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"campaign_asset_id":"a1"'),
      }),
    );
  });

  it("presents unavailable creation without exposing implementation terms", () => {
    render(
      <CanonicalCampaignBriefsCard
        campaignId="c1"
        assets={[]}
        briefs={[]}
        canCreate={false}
        onCreated={vi.fn()}
      />,
    );
    expect(screen.getByText("Brief creation unavailable")).toBeTruthy();
    expect(screen.queryByText(/legacy|migration|canonical/i)).toBeNull();
  });
});
