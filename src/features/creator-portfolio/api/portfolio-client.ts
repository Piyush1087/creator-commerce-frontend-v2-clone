import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  PortfolioCommandSchema,
  PortfolioConsumerSchema,
  type PortfolioCommand,
  type PortfolioFilter,
} from "../contracts/portfolio-consumer";
export class PortfolioRequestError extends Error {
  constructor(readonly status: number) {
    super(
      status === 409
        ? "Portfolio changed. Review the latest work before saving again."
        : status === 400
          ? "Check the work link and field values."
          : status === 401 || status === 403
            ? "Portfolio access could not be authorized."
            : "Portfolio could not be loaded or saved. Unsaved changes are preserved.",
    );
  }
}
export async function readPortfolio(
  filter: PortfolioFilter,
  signal?: AbortSignal,
  cursor?: string,
) {
  const query = new URLSearchParams({ filter });
  if (cursor) query.set("cursor", cursor);
  return request(`${env.apiUrl}/api/v1/creator/portfolio?${query}`, {
    method: "GET",
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
}
export async function writePortfolio(
  command: PortfolioCommand,
  signal?: AbortSignal,
) {
  return request(`${env.apiUrl}/api/v1/creator/portfolio`, {
    method: "PUT",
    signal,
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(PortfolioCommandSchema.parse(command)),
  });
}
async function request(url: string, init: RequestInit) {
  const response = await authenticatedFetch(url, init);
  if (!response.ok) throw new PortfolioRequestError(response.status);
  const parsed = PortfolioConsumerSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new Error(
      "Portfolio returned an invalid response. Last confirmed work is retained.",
    );
  return parsed.data;
}
