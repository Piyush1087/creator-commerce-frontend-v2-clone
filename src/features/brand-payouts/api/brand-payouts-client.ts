import { env } from "../../../shared/config/env";
import { authenticatedFetch as fetch } from "../../../shared/api/authenticated-fetch";
import type { BrandPayoutsHubResponse } from "../contracts/brand-payouts.contracts";

const BASE = `${env.apiUrl}/api/v1/brand/payouts`;

export async function fetchBrandPayoutsHub(): Promise<BrandPayoutsHubResponse> {
  const response = await fetch(BASE, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load brand payouts (${response.status})`);
  }
  return (await response.json()) as BrandPayoutsHubResponse;
}
