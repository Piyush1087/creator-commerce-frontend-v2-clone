import { authenticatedFetch } from "../../../shared/api/authenticated-fetch";
import { env } from "../../../shared/config/env";
import {
  WorkConsumerSchema,
  RateConsumerSchema,
  WorkCommandSchema,
  RateCommandSchema,
  type WorkCommand,
  type RateCommand,
} from "../contracts/commercial.schema";
export class CommercialRequestError extends Error {
  constructor(readonly status: number) {
    super(
      status === 409
        ? "Commercial Setup changed. Review the latest values before saving."
        : status === 400
          ? "Check the field values and try again."
          : status === 401 || status === 403
            ? "Your Commercial Setup access could not be authorized."
            : "Commercial Setup could not be loaded or saved. Previously confirmed values and unsaved changes are preserved.",
    );
  }
}
async function request(
  section: "work-preferences" | "rate-card",
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await authenticatedFetch(
    `${env.apiUrl}/api/v1/creator/commercial-setup/${section}`,
    {
      method: body === undefined ? "GET" : "PUT",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  );
  if (!response.ok) throw new CommercialRequestError(response.status);
  return response.json();
}
export const fetchWork = async (signal?: AbortSignal) =>
  WorkConsumerSchema.parse(
    await request("work-preferences", undefined, signal),
  );
export const fetchRates = async (signal?: AbortSignal) =>
  RateConsumerSchema.parse(await request("rate-card", undefined, signal));
export const saveWork = async (command: WorkCommand) =>
  WorkConsumerSchema.parse(
    await request("work-preferences", WorkCommandSchema.parse(command)),
  );
export const saveRates = async (command: RateCommand) =>
  RateConsumerSchema.parse(
    await request("rate-card", RateCommandSchema.parse(command)),
  );
