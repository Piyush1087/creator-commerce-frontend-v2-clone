import { useCallback, useEffect, useState } from "react";

import {
  fetchAnalyticsPulse,
  fetchMediaKit,
  saveMediaKit,
} from "../api/creator-centre-client";
import type {
  AnalyticsPulseResponse,
  MediaKitResponse,
  MediaKitSavePayload,
} from "../contracts/creator-centre.contracts";

export function useMediaKit() {
  const [mediaKit, setMediaKit] = useState<MediaKitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMediaKit();
      setMediaKit(response);
    } catch (err) {
      setMediaKit(null);
      setError(err instanceof Error ? err.message : "Failed to load media kit.");
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (payload: MediaKitSavePayload) => {
    setSaving(true);
    setError(null);
    try {
      const response = await saveMediaKit(payload);
      setMediaKit(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save media kit.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { mediaKit, loading, saving, error, reload: load, save };
}

export function useAnalyticsPulse(limitCount = 5) {
  const [analytics, setAnalytics] = useState<AnalyticsPulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAnalyticsPulse(limitCount);
      setAnalytics(response);
    } catch (err) {
      setAnalytics(null);
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [limitCount]);

  useEffect(() => {
    void load();
  }, [load]);

  return { analytics, loading, error, reload: load };
}
