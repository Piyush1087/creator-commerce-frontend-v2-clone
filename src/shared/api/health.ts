import { httpClient } from "./http-client";

export type HealthResponse = {
  status: string;
};

export async function getApiHealth() {
  const response = await httpClient.get<HealthResponse>("/health");
  return response.data;
}
