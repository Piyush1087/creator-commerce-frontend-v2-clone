import type { CanonicalGeography } from "../types/campaign-wizard";

export type GeographySuggestion = { id: string; label: string };
export type GeographySearchAdapter = {
  configured: boolean;
  search(query: string): Promise<GeographySuggestion[]>;
  resolve(id: string): Promise<CanonicalGeography>;
};

/** Safe default until a Places provider and browser key are configured externally. */
export const unavailableGeographySearchAdapter: GeographySearchAdapter = {
  configured: false,
  async search() { return []; },
  async resolve() { throw new Error("Structured geography search is not configured."); },
};
