import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  InstagramB4ResponseSchema,
  type InstagramB4Response,
} from "../contracts/instagram-b4.schemas";

export const INSTAGRAM_B4_PATH = "/api/v1/brand-centre/instagram";

export async function getInstagramB4(): Promise<InstagramB4Response> {
  const response = await authenticatedFetch(
    `${env.apiUrl}${INSTAGRAM_B4_PATH}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  const body: unknown = await response.json();
  if (!response.ok)
    throw new Error("Instagram Intelligence is temporarily unavailable.");
  const parsed = InstagramB4ResponseSchema.safeParse(body);
  if (!parsed.success)
    throw new Error(
      "Creator Shop returned an invalid Instagram Intelligence response.",
    );
  return parsed.data;
}
