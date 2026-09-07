import { useCallback, useEffect, useState } from "react";

import {
  authorizeCreatorInstagramSettingsInitial,
  authorizeCreatorInstagramSettingsReconnect,
  disconnectCreatorInstagramSettings,
  fetchCreatorInstagramSettings,
  revalidateCreatorInstagramSettings,
} from "../api/creator-instagram-settings-client";
import type { CreatorInstagramSettingsReadModel } from "../contracts/creator-instagram-settings.contracts";
import { creatorInstagramFriendlyError } from "../utils/creator-instagram-settings-state";

export function useCreatorInstagramSettings() {
  const [data, setData] = useState<CreatorInstagramSettingsReadModel | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchCreatorInstagramSettings());
    } catch (caught) {
      setError(creatorInstagramFriendlyError(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const revalidate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await revalidateCreatorInstagramSettings();
      setData(result.settings);
      setMessage(
        result.revalidated
          ? "Instagram authorization is healthy."
          : "Instagram status was refreshed and still needs attention.",
      );
    } catch (caught) {
      setError(creatorInstagramFriendlyError(caught));
      throw caught;
    } finally {
      setBusy(false);
    }
  }, []);

  const authorizeReconnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      return await authorizeCreatorInstagramSettingsReconnect();
    } catch (caught) {
      setError(creatorInstagramFriendlyError(caught));
      throw caught;
    } finally {
      setBusy(false);
    }
  }, []);

  const authorizeInitial = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      return await authorizeCreatorInstagramSettingsInitial();
    } catch (caught) {
      setError(creatorInstagramFriendlyError(caught));
      throw caught;
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await disconnectCreatorInstagramSettings();
      setData(result.settings);
      setMessage(
        "Instagram disconnected. The permanent account identity was retained for safe recovery.",
      );
    } catch (caught) {
      setError(creatorInstagramFriendlyError(caught));
      throw caught;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    data,
    loading,
    busy,
    error,
    message,
    reload,
    revalidate,
    authorizeInitial,
    authorizeReconnect,
    disconnect,
  };
}
