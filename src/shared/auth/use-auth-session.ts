import { useSyncExternalStore } from "react";

import { getAuthSessionSnapshot, subscribeToAuthSession } from "./auth-session";

export function useAuthSession() {
  return useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionSnapshot,
  );
}
