import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CampaignAssetReconciliationCard } from "./CampaignAssetReconciliationCard";

afterEach(() => vi.restoreAllMocks());

describe("CampaignAssetReconciliationCard", () => {
  it("renders a canonical Asset as read-only when selection is unavailable", () => {
    render(
      <CampaignAssetReconciliationCard
        campaignId="c1"
        assets={[{ campaign_asset_id: "a1", kind: "OFFERING", status: "ACTIVE", entity_id: "o1", label: "Serum", subtype: "PRODUCT", image_url: null }]}
        reconciliation={{ required: false, title: null, message: null }}
        canSelect={false}
        onLinked={vi.fn()}
      />,
    );
    expect(screen.getByText("Serum")).toBeTruthy();
    expect(screen.queryByText("Link Asset")).toBeNull();
  });

  it("requires explicit selection and submits only the chosen entity", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([{ kind: "OFFERING", entity_id: "o1", label: "Serum", subtype: "PRODUCT", image_url: null }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ campaign_asset_id: "a1" }), { status: 200 }));
    const onLinked = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignAssetReconciliationCard
        campaignId="c1"
        assets={[]}
        reconciliation={{ required: true, title: "Campaign setup needs reconciliation", message: "Link the correct Brand Centre Asset before continuing this Campaign." }}
        canSelect
        onLinked={onLinked}
      />,
    );
    expect(screen.getByText("Campaign setup needs reconciliation")).toBeTruthy();
    const button = screen.getByText("Link Asset") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await waitFor(() => expect(screen.getByText("Serum (PRODUCT)")).toBeTruthy());
    fireEvent.change(
      screen.getByLabelText("Select the Brand Centre Asset this Campaign promotes"),
      { target: { value: "OFFERING:o1" } },
    );
    fireEvent.click(button);
    await waitFor(() => expect(onLinked).toHaveBeenCalled());
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ kind: "OFFERING", entity_id: "o1" }),
    }));
  });
});
