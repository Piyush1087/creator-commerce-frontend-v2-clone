import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  creatorHomeResponseSchema,
  type CreatorHomeResponse,
} from "../contracts/creator-home.schemas";

export async function fetchCreatorHome(
  signal?: AbortSignal,
): Promise<CreatorHomeResponse> {
  const response = await authenticatedFetch(
    `${env.apiUrl}/api/v1/creator/home`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 403
        ? "Creator workspace access could not be verified."
        : "Creator Home could not be loaded.",
    );
  return creatorHomeResponseSchema.parse(await response.json());
}
