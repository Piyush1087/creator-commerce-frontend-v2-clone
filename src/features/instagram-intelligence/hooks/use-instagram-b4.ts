import { useEffect, useState } from "react";
import {
  getInstagramB4,
  InstagramRefreshError,
  refreshInstagram,
} from "../api/instagram-b4-client";
import type { InstagramB4Response } from "../contracts/instagram-b4.schemas";

export function useInstagramB4() {
  const [data, setData] = useState<InstagramB4Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [cooldownEndsAt, setCooldownEndsAt] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getInstagramB4()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active)
          setError("Instagram Intelligence is temporarily unavailable.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function requestRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setAnnouncement("Requesting an Instagram refresh.");
    try {
      const result = await refreshInstagram();
      setCooldownEndsAt(
        new Date(Date.now() + result.cooldownSeconds * 1000).toISOString(),
      );
      setAnnouncement(
        "Refresh accepted. Current intelligence remains available while new analysis runs.",
      );
      const latest = await getInstagramB4();
      setData(latest);
      setError(null);
    } catch (caught) {
      if (caught instanceof InstagramRefreshError) {
        if (caught.kind === "COOLDOWN" && caught.retryAfterSeconds) {
          setCooldownEndsAt(
            new Date(
              Date.now() + caught.retryAfterSeconds * 1000,
            ).toISOString(),
          );
        }
        setAnnouncement(caught.message);
      } else {
        setAnnouncement(
          "Instagram refresh could not be requested. Current intelligence is unchanged.",
        );
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    announcement,
    cooldownEndsAt:
      cooldownEndsAt ??
      (data?.actions.manualRefresh.state === "ALLOWED"
        ? data.actions.manualRefresh.cooldownEndsAt
        : null),
    requestRefresh,
  };
}
