import { env } from "../config/env";

export type HealthResponse = {
  status: string;
};

export async function getApiHealth(): Promise<HealthResponse> {
  const response = await fetch(`${env.apiUrl}/health`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Health request failed (${response.status}).`);
  }
  return (await response.json()) as HealthResponse;
}
