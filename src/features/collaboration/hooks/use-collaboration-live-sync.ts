import { useEffect } from "react";

/**
 * Polls collaboration thread data while a conversation is open.
 * Drop-in replacement path: swap this hook for a WebSocket subscriber
 * that calls the same `onSync` callback when events arrive.
 */
export function useCollaborationLiveSync(
  enabled: boolean,
  onSync: () => void | Promise<void>,
  intervalMs = 3000,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tick = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void onSync();
    };

    tick();
    const intervalId = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, onSync]);
}
