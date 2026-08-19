import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCampaignPageView,
  fetchCanonicalCampaignAssets,
  fetchCanonicalCampaignBriefs,
} from "./brand-uce-client";

function response(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn().mockReturnValue(null),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("Campaign-owned contextual reads", () => {
  it("uses the canonical Campaign, Asset and Brief read endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ campaign: { id: "campaign/1" } }))
      .mockResolvedValueOnce(response([{ campaign_asset_id: "asset-1" }]))
      .mockResolvedValueOnce(response([{ brief_id: "brief-1" }]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchCampaignPageView("campaign/1");
    await fetchCanonicalCampaignAssets("campaign/1");
    await fetchCanonicalCampaignBriefs("campaign/1");

    expect(fetchMock.mock.calls[0][0]).toMatch(/campaigns\/campaign%2F1\/page$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/campaigns\/campaign%2F1\/assets$/);
    expect(fetchMock.mock.calls[2][0]).toMatch(/campaigns\/campaign%2F1\/canonical-briefs$/);
    expect(fetchMock.mock.calls.map((call) => call[1])).toEqual([
      expect.objectContaining({ method: "GET" }),
      expect.objectContaining({ method: "GET" }),
      expect.objectContaining({ method: "GET" }),
    ]);
  });

  it("surfaces Campaign-owned read failures without compatibility fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ message: "Campaign not found" }, false, 404)),
    );

    await expect(fetchCanonicalCampaignAssets("foreign-campaign")).rejects.toThrow(
      "Campaign not found",
    );
  });
});
