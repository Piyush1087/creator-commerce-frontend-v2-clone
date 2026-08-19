import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveCampaignApplication,
  createCanonicalCampaignBrief,
  fetchCampaignPageView,
  fetchCanonicalCampaignAssets,
  fetchCanonicalCampaignBriefs,
  fetchSelectableCampaignAssets,
  linkCanonicalCampaignAsset,
  updateCanonicalCampaignBrief,
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

describe("Campaign Page canonical API client", () => {
  it("consumes selectable and linked Campaign Assets without translating entities", async () => {
    const selectable = [
      {
        kind: "OFFERING",
        entity_id: "offering-1",
        label: "Serum",
        subtype: "PRODUCT",
        image_url: null,
      },
    ];
    const linked = [
      {
        ...selectable[0],
        campaign_asset_id: "asset-1",
        status: "ACTIVE",
      },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(selectable))
      .mockResolvedValueOnce(response(linked));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSelectableCampaignAssets()).resolves.toEqual(selectable);
    await expect(fetchCanonicalCampaignAssets("campaign/1")).resolves.toEqual(
      linked,
    );

    expect(fetchMock.mock.calls[0][0]).toMatch(/campaign-assets\/selectable$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(
      /campaigns\/campaign%2F1\/assets$/,
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "GET" });
  });

  it("links only the explicitly selected Brand Centre reference", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        campaign_asset_id: "asset-1",
        kind: "BRAND",
        entity_id: "brand-1",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await linkCanonicalCampaignAsset("campaign-1", {
      kind: "BRAND",
      entity_id: "brand-1",
    });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ kind: "BRAND", entity_id: "brand-1" }),
    });
  });

  it("surfaces duplicate link conflicts without fallback data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          {
            message:
              "This Brand Centre Asset is already linked to the Campaign.",
          },
          false,
          409,
        ),
      ),
    );

    await expect(
      linkCanonicalCampaignAsset("campaign-1", {
        kind: "OFFERING",
        entity_id: "foreign-offering",
      }),
    ).rejects.toThrow("already linked");
  });

  it("surfaces foreign/not-found Asset reads without fabricating an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ message: "Campaign not found" }, false, 404),
        ),
    );

    await expect(
      fetchCanonicalCampaignAssets("foreign-campaign"),
    ).rejects.toThrow("Campaign not found");
  });

  it("surfaces backend terminal and validation rejection for canonical writes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({ message: "This Campaign is read-only." }, false, 409),
      )
      .mockResolvedValueOnce(
        response(
          { message: "creative_requirements must be longer" },
          false,
          400,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      linkCanonicalCampaignAsset("campaign-terminal", {
        kind: "BRAND",
        entity_id: "brand-1",
      }),
    ).rejects.toThrow("read-only");
    await expect(
      createCanonicalCampaignBrief("campaign-1", {
        campaign_asset_id: "asset-1",
        title: "Brief",
        creative_requirements: "short",
        deliverables: [],
      }),
    ).rejects.toThrow("creative_requirements must be longer");
  });

  it("creates a canonical Brief beneath one Asset and never sends reassignment on PATCH", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ brief_id: "brief-1" }))
      .mockResolvedValueOnce(response({ brief_id: "brief-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const write = {
      title: "Launch Brief",
      creative_requirements: "Show the product clearly.",
      deliverables: [
        {
          format: "REEL",
          quantity: 1,
          creative_requirements: "One vertical reel.",
          publishing_required: true,
        },
      ],
    };

    await fetchCanonicalCampaignBriefs("campaign-1");
    await createCanonicalCampaignBrief("campaign-1", {
      campaign_asset_id: "asset-1",
      ...write,
    });
    await updateCanonicalCampaignBrief("campaign-1", "brief/1", write);

    expect(fetchMock.mock.calls[0][0]).toMatch(/canonical-briefs$/);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ campaign_asset_id: "asset-1", ...write }),
    });
    expect(fetchMock.mock.calls[2][0]).toMatch(/canonical-briefs\/brief%2F1$/);
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify(write),
    });
    expect(fetchMock.mock.calls[2][1].body).not.toContain("campaign_asset_id");
  });

  it("uses canonical /page rather than the legacy reporting endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ performanceSummary: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchCampaignPageView("campaign-1");

    expect(fetchMock.mock.calls[0][0]).toMatch(/campaigns\/campaign-1\/page$/);
    expect(fetchMock.mock.calls[0][0]).not.toContain("/reporting");
  });

  it("surfaces page retrieval failure so the route can offer a real retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ message: "temporarily unavailable" }, false, 503),
        ),
    );

    await expect(fetchCampaignPageView("campaign-1")).rejects.toThrow(
      "temporarily unavailable",
    );
  });

  it("preserves the current Application /approve command and never calls /accept", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ status: "APPROVED" }));
    vi.stubGlobal("fetch", fetchMock);

    await approveCampaignApplication("campaign-1", "application-1");

    expect(fetchMock.mock.calls[0][0]).toMatch(
      /campaigns\/campaign-1\/applications\/application-1\/approve$/,
    );
    expect(fetchMock.mock.calls[0][0]).not.toContain("/accept");
  });
});
