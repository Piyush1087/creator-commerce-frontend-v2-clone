import { useCallback, useEffect, useState } from "react";

import { fetchCreatorPayoutsHub } from "../../creator-payouts/api/creator-payouts-client";
import type { CreatorPayoutsHubResponse } from "../../creator-payouts/contracts/creator-payouts.contracts";
import {
  fetchCreatorPayoutSettings,
  upsertCreatorPayoutBank,
} from "../api/creator-settings-client";
import type {
  CreatorPayoutSettingsResponse,
  UpsertCreatorPayoutBankPayload,
} from "../contracts/creator-settings.contracts";

export function useCreatorPayoutsSettings() {
  const [settings, setSettings] = useState<CreatorPayoutSettingsResponse | null>(null);
  const [hub, setHub] = useState<CreatorPayoutsHubResponse | null>(null);
  const [hubError, setHubError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHubError(null);
    try {
      const settingsResponse = await fetchCreatorPayoutSettings();
      setSettings(settingsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payout settings.");
    }

    try {
      const hubResponse = await fetchCreatorPayoutsHub();
      setHub(hubResponse);
    } catch (err) {
      setHub(null);
      setHubError(
        err instanceof Error ? err.message : "Earnings telemetry unavailable.",
      );
    } finally {
      setLoading(false);
    }
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
        const message = err instanceof Error ? err.message : "Failed to save bank account.";
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
    hub,
    hubError,
    loading,
    saving,
    error,
    reload,
    saveBank,
  };
}
