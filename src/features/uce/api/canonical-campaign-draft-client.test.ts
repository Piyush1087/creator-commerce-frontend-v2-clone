import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CanonicalDraftRequestError,
  fetchCanonicalCampaignReadiness,
} from "./canonical-campaign-draft-client";

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn().mockReturnValue(null),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("fetchCanonicalCampaignReadiness", () => {
  it("uses only the encoded Campaign ID and authenticated GET request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          campaignId: "campaign/1",
          objective: "PULSE",
          status: "READY",
          currency: "INR",
          primaryKpi: "REACH",
          supportingKpis: ["IMPRESSIONS"],
          revision: "objective:PULSE",
        }),
      ),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCanonicalCampaignReadiness("campaign/1");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain("campaign%2F1/readiness");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    expect(result).toMatchObject({ status: "READY", currency: "INR" });
  });

  it("classifies 5xx responses without exposing speculative readiness", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ message: "unavailable" })),
      }),
    );

    await expect(fetchCanonicalCampaignReadiness("campaign-1")).rejects.toEqual(
      new CanonicalDraftRequestError("unavailable", 503),
    );
  });

  it("normalizes network failures to a stable transport error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("socket details")),
    );

    await expect(fetchCanonicalCampaignReadiness("campaign-1")).rejects.toEqual(
      new CanonicalDraftRequestError(
        "Campaign readiness is temporarily unavailable.",
        null,
      ),
    );
  });
});
