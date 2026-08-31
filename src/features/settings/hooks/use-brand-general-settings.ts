import { useCallback, useEffect, useState } from "react";

import {
  cancelBrandTeamInvitation,
  BrandSettingsApiError,
  fetchBrandGeneralSettings,
  inviteBrandTeamMember,
  revokeBrandTeamMember,
  updateBrandGeneralSettings,
  updateBrandTeamRole,
} from "../api/brand-settings-client";
import type {
  BrandGeneralResponse,
  BrandSettingsRole,
  InviteTeamMemberPayload,
  UpdateBrandGeneralPayload,
  UpdateTeamRolePayload,
} from "../contracts/brand-settings.contracts";

export function useBrandGeneralSettings() {
  const [data, setData] = useState<BrandGeneralResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const recordError = useCallback((err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : fallback;
    const status = err instanceof BrandSettingsApiError ? err.status : null;
    setError(message);
    setErrorStatus(status);
    if (status === 403) setData(null);
    return message;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const response = await fetchBrandGeneralSettings();
      setData(response);
    } catch (err) {
      recordError(err, "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [recordError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveGeneral = useCallback(
    async (payload: UpdateBrandGeneralPayload) => {
      setSaving(true);
      setError(null);
      setErrorStatus(null);
      try {
        const response = await updateBrandGeneralSettings(payload);
        setData(response);
        return response;
      } catch (err) {
        recordError(err, "Failed to save settings.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [recordError],
  );

  const inviteMember = useCallback(
    async (payload: InviteTeamMemberPayload) => {
      setError(null);
      setErrorStatus(null);
      try {
        const dispatched = await inviteBrandTeamMember(payload);
        await reload();
        return dispatched;
      } catch (err) {
        recordError(err, "Failed to send invitation.");
        throw err;
      }
    },
    [recordError, reload],
  );

  const revokeMember = useCallback(
    async (membershipId: string) => {
      setError(null);
      setErrorStatus(null);
      try {
        await revokeBrandTeamMember(membershipId);
        await reload();
      } catch (err) {
        recordError(err, "Failed to revoke member.");
        throw err;
      }
    },
    [recordError, reload],
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      setError(null);
      setErrorStatus(null);
      try {
        await cancelBrandTeamInvitation(invitationId);
        await reload();
      } catch (err) {
        recordError(err, "Failed to cancel invitation.");
        throw err;
      }
    },
    [recordError, reload],
  );

  const changeRole = useCallback(
    async (payload: UpdateTeamRolePayload) => {
      setError(null);
      setErrorStatus(null);
      try {
        await updateBrandTeamRole(payload);
        await reload();
      } catch (err) {
        recordError(err, "Failed to update workspace role.");
        throw err;
      }
    },
    [recordError, reload],
  );

  return {
    data,
    loading,
    saving,
    error,
    errorStatus,
    reload,
    saveGeneral,
    inviteMember,
    revokeMember,
    cancelInvitation,
    changeRole,
  };
}

export type { BrandSettingsRole };
