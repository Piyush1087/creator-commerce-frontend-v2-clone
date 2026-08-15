import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { fetchCampaignShell } from "../../../features/uce/api/brand-uce-client";
import type { CampaignShellResponse } from "../../../features/uce/contracts/brand-uce.contracts";
import { BrandUceCampaignDetailPage } from "./BrandUceCampaignDetailPage";

vi.mock("../../../features/uce/api/brand-uce-client", () => ({
  fetchCampaignShell: vi.fn(),
  patchCampaignEssentials: vi.fn(),
  patchCampaignStatus: vi.fn(),
}));

vi.mock("../../../features/uce/components/CampaignWorkspaceZone1", () => ({ CampaignWorkspaceZone1: ({ shell }: { shell: CampaignShellResponse }) => <h1>{shell.campaign_name}</h1> }));
vi.mock("../../../features/uce/components/CampaignProductsBriefsRepository", () => ({ CampaignProductsBriefsRepository: () => null }));
vi.mock("../../../features/uce/components/CanonicalCampaignBriefsCard", () => ({ CanonicalCampaignBriefsCard: () => null }));
vi.mock("../../../features/uce/components/CampaignAssetReconciliationCard", () => ({ CampaignAssetReconciliationCard: () => null }));
vi.mock("../../../features/uce/components/CampaignReadinessWorkspaceCard", () => ({ CampaignReadinessWorkspaceCard: () => null }));
vi.mock("../../../features/uce/components/CampaignHeroEditDrawer", () => ({ CampaignHeroEditDrawer: () => null }));
vi.mock("../../../features/uce/components/ProductDetailDrawer", () => ({ ProductDetailDrawer: () => null }));
vi.mock("../../../features/uce/components/BriefSnapshotDrawer", () => ({ BriefSnapshotDrawer: () => null }));
vi.mock("../../../features/uce/components/CampaignShareRouterModal", () => ({ CampaignShareRouterModal: () => null }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const recoveredShell = {
  campaign_id: "c1",
  campaign_name: "Recovered Campaign",
  current_status: "DRAFT",
  campaign_assets: [],
  reconciliation: { required: false, title: null, message: null },
  capabilities: { can_execute_campaign: false },
  zone_2_tactics: { products: [], briefs: [], canonical_briefs: [] },
} as unknown as CampaignShellResponse;

describe("Campaign primary read recovery", () => {
  it("keeps the route recoverable and renders authoritative data after retry", async () => {
    vi.mocked(fetchCampaignShell)
      .mockRejectedValueOnce(new Error("Campaign read failed."))
      .mockResolvedValueOnce(recoveredShell);
    render(
      <MemoryRouter initialEntries={["/campaign/c1"]}>
        <Routes><Route path="/campaign/:id" element={<BrandUceCampaignDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Campaign read failed.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Recovered Campaign")).toBeTruthy();
    expect(fetchCampaignShell).toHaveBeenCalledTimes(2);
  });
});
