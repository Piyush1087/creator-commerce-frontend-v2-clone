import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  creatorContentSchema,
  type CreatorContent,
} from "../contracts/creator-content.schema";

export async function fetchCreatorContent(
  signal?: AbortSignal,
): Promise<CreatorContent> {
  const response = await authenticatedFetch(
    `${env.apiUrl}/api/v1/creator/insights/content`,
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
        ? "Content access could not be verified."
        : "Content insights could not be loaded.",
    );
  return creatorContentSchema.parse(await response.json());
}
