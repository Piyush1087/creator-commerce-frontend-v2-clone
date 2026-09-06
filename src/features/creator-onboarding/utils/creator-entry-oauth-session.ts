export type CreatorInstagramFlowMode = "INITIAL_CONNECT" | "RECONNECT";
const STORAGE_KEY = "creator-entry.instagram-flow-mode";

export function saveCreatorInstagramFlowMode(
  mode: CreatorInstagramFlowMode,
): void {
  window.sessionStorage.setItem(STORAGE_KEY, mode);
}

export function readCreatorInstagramFlowMode(): CreatorInstagramFlowMode | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  return value === "INITIAL_CONNECT" || value === "RECONNECT" ? value : null;
}

export function clearCreatorInstagramFlowMode(): void {
  if (typeof window !== "undefined")
    window.sessionStorage.removeItem(STORAGE_KEY);
}
