import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CampaignParticipationCard } from "./CampaignParticipationCard";

afterEach(() => vi.restoreAllMocks());

describe("CampaignParticipationCard", () => {
  it("uses canonical applications and does not call the legacy pipeline", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ availability: "UNAVAILABLE", message: "Recommendations are not available.", recommendations: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ application_id: "app-1", status: "SUBMITTED", creator: { creator_user_id: "creator-1", name: "Creator", email: "creator@example.invalid" }, brief: { brief_id: "brief-1", title: "Launch Brief" }, collaboration_reference: null, created_at: "2026-08-15T00:00:00.000Z" }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ application_id: "app-1", status: "ACCEPTED" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ availability: "UNAVAILABLE", message: "Recommendations are not available.", recommendations: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    render(<CampaignParticipationCard campaignId="campaign-1" workspace="applications" />);
    await waitFor(() => expect(screen.getByText("Creator")).toBeTruthy());
    fireEvent.click(screen.getByText("Accept application"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes("/pipeline/"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/applications/app-1/accept"))).toBe(true);
  });
});
