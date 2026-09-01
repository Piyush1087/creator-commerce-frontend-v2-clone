const STORAGE_KEY = "creator-settings.instagram-reconnect";
export type CreatorInstagramSettingsFlow =
  | "INITIAL_CONNECT"
  | "SAME_ID_RECONNECT";

export function saveCreatorInstagramSettingsFlow(
  flow: CreatorInstagramSettingsFlow,
): void {
  window.sessionStorage.setItem(STORAGE_KEY, flow);
}

export function saveCreatorInstagramSettingsReconnect(): void {
  saveCreatorInstagramSettingsFlow("SAME_ID_RECONNECT");
}

export function hasCreatorInstagramSettingsReconnect(): boolean {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(STORAGE_KEY) === "SAME_ID_RECONNECT"
  );
}

export function hasCreatorInstagramSettingsInitialConnect(): boolean {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(STORAGE_KEY) === "INITIAL_CONNECT"
  );
}

export function clearCreatorInstagramSettingsReconnect(): void {
  if (typeof window !== "undefined")
    window.sessionStorage.removeItem(STORAGE_KEY);
}
