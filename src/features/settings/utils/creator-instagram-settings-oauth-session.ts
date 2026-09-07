const STORAGE_KEY = "creator-settings.instagram-reconnect";
export type CreatorInstagramSettingsFlow =
  | "INITIAL_CONNECT"
  | "SAME_ID_RECONNECT";

export function saveCreatorInstagramSettingsFlow(
  flow: CreatorInstagramSettingsFlow,
): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, flow);
  } catch {
    // The caller will fail closed at callback time if tab storage is blocked.
  }
}

export function saveCreatorInstagramSettingsReconnect(): void {
  saveCreatorInstagramSettingsFlow("SAME_ID_RECONNECT");
}

export function readCreatorInstagramSettingsFlow(): CreatorInstagramSettingsFlow | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    return value === "INITIAL_CONNECT" || value === "SAME_ID_RECONNECT"
      ? value
      : null;
  } catch {
    return null;
  }
}

export function hasCreatorInstagramSettingsReconnect(): boolean {
  return readCreatorInstagramSettingsFlow() === "SAME_ID_RECONNECT";
}

export function hasCreatorInstagramSettingsInitialConnect(): boolean {
  return readCreatorInstagramSettingsFlow() === "INITIAL_CONNECT";
}

export function clearCreatorInstagramSettingsFlow(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else can safely be recovered when tab storage is blocked.
  }
}

export function clearCreatorInstagramSettingsReconnect(): void {
  clearCreatorInstagramSettingsFlow();
}
