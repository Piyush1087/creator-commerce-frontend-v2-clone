import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import { CreatorBrandConsumerSchema } from "../contracts/creator-brand-consumer.schema";
import {
  CreatorBrandMutationRequestSchema,
  type CreatorBrandCommand,
} from "../contracts/creator-brand-profile.contract";

export class CreatorBrandRequestError extends Error {
  constructor(readonly status: number) {
    super(
      status === 409
        ? "Creator Brand changed. Review the latest confirmed values before saving."
        : status === 400
          ? "Check the field values and try again."
          : status === 403
            ? "Your Creator Brand action could not be authorized."
            : "Creator Brand could not be loaded or saved. Your unsaved changes are preserved.",
    );
  }
}
async function request(command?: CreatorBrandCommand, signal?: AbortSignal) {
  const response = await authenticatedFetch(
    `${env.apiUrl}/api/v1/creator/brand`,
    {
      method: command ? "PUT" : "GET",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
        ...(command ? { "Content-Type": "application/json" } : {}),
      },
      ...(command
        ? {
            body: JSON.stringify(
              CreatorBrandMutationRequestSchema.parse(command),
            ),
          }
        : {}),
    },
  );
  if (!response.ok) throw new CreatorBrandRequestError(response.status);
  const parsed = CreatorBrandConsumerSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new Error(
      "Creator Brand returned an invalid response. Previously confirmed values are preserved.",
    );
  return parsed.data;
}
export const fetchCreatorBrand = (signal?: AbortSignal) =>
  request(undefined, signal);
export const mutateCreatorBrand = (command: CreatorBrandCommand) =>
  request(command);
