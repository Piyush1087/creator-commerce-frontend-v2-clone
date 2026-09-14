import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { fetchCreatorAudience } from "./creator-audience-client";

vi.mock("../../../shared/api/authenticated-fetch", () => ({
  authenticatedFetch: vi.fn(),
}));

const valid = {
  contractVersion: "creator_audience_v0.1",
  generatedAt: "2026-09-14T10:00:00.000Z",
  status: "UNAVAILABLE",
  context: { role: "MANAGER" },
  source: "INSTAGRAM",
  sourceStatus: "PROVIDER_FAILURE",
  snapshotBasis: {
    period: "lifetime",
    timeframe: "this_month",
    capturedAt: null,
  },
  defaultCohort: null,
  highlights: [],
  cohorts: [],
  freshness: { state: "UNKNOWN", staleAfterHours: 192 },
  processingState: "FAILED",
  currentPreserved: false,
  limitations: ["PROVIDER_FAILURE"],
  settingsRecoveryRoute: "/creator/settings/instagram",
};

beforeEach(() => vi.mocked(authenticatedFetch).mockReset());

describe("Creator Audience authenticated client", () => {
  it("uses the authenticated no-store read and accepts the strict contract", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(valid), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(fetchCreatorAudience()).resolves.toMatchObject(valid);
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/creator/insights/audience"),
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("fails closed on malformed or widened payloads", async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify({ ...valid, providerPayload: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(fetchCreatorAudience()).rejects.toThrow();
  });
});
