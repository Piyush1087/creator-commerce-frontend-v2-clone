import { useCallback, useEffect, useState } from "react";

import {
  disableCreatorPayoutDestination,
  fetchCreatorPayoutSettings,
  replaceCreatorPayoutDestination,
  upsertCreatorLegalProfile,
} from "../api/creator-payout-settings-client";
import type {
  CreatorLegalProfileWrite,
  CreatorPayoutDestinationWrite,
  CreatorPayoutSettingsResponse,
} from "../contracts/creator-payout-settings.contract";

export function useCreatorPayoutSettings() {
  const [data, setData] = useState<CreatorPayoutSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchCreatorPayoutSettings());
    } catch (caught) {
      setData(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Payout settings could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const runMutation = useCallback(
    async (mutation: () => Promise<void>) => {
      setSaving(true);
      setError(null);
      try {
        await mutation();
        await reload();
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Payout settings could not be updated.";
        setError(message);
        throw caught;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return {
    data,
    loading,
    saving,
    error,
    reload,
    replaceDestination: (payload: CreatorPayoutDestinationWrite) =>
      runMutation(() => replaceCreatorPayoutDestination(payload)),
    disableDestination: (destinationId: string) =>
      runMutation(() => disableCreatorPayoutDestination(destinationId)),
    saveLegalProfile: (payload: CreatorLegalProfileWrite) =>
      runMutation(() => upsertCreatorLegalProfile(payload)),
  };
}
