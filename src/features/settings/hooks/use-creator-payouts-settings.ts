import { useCallback, useEffect, useState } from "react";

import {
  fetchCreatorPayoutSettings,
  upsertCreatorPayoutBank,
} from "../api/creator-settings-client";
import type {
  CreatorPayoutSettingsResponse,
  UpsertCreatorPayoutBankPayload,
} from "../contracts/creator-settings.contracts";

export function useCreatorPayoutsSettings() {
  const [settings, setSettings] =
    useState<CreatorPayoutSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settingsResponse = await fetchCreatorPayoutSettings();
      setSettings(settingsResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load payout settings.",
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveBank = useCallback(
    async (payload: UpsertCreatorPayoutBankPayload) => {
      setSaving(true);
      setError(null);
      try {
        await upsertCreatorPayoutBank(payload);
        await reload();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save bank account.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return {
    settings,
    loading,
    saving,
    error,
    reload,
    saveBank,
  };
}
