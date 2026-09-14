import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  creatorAudienceSchema,
  type CreatorAudience,
} from "../contracts/creator-audience.schema";

export async function fetchCreatorAudience(
  signal?: AbortSignal,
): Promise<CreatorAudience> {
  const response = await authenticatedFetch(
    `${env.apiUrl}/api/v1/creator/insights/audience`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "Audience access could not be verified."
        : "Audience could not be loaded.",
    );
  }
  return creatorAudienceSchema.parse(await response.json());
}
