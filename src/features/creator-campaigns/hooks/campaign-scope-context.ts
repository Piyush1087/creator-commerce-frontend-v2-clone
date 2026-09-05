import { createContext, useContext } from "react";
import type { CampaignScope } from "../api/c03-scope";
export const ScopeContext = createContext<CampaignScope | null>(null);
export function useCampaignScope() {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error("Campaign authority is required");
  return scope;
}
