import { useCallback, useEffect, useState } from "react";

import {
  cancelBrandTeamInvitation,
  fetchBrandGeneralSettings,
  inviteBrandTeamMember,
  revokeBrandTeamMember,
  updateBrandGeneralSettings,
} from "../api/brand-settings-client";
import type {
  BrandGeneralResponse,
  BrandSettingsRole,
  InviteTeamMemberPayload,
  UpdateBrandGeneralPayload,
} from "../contracts/brand-settings.contracts";

export function useBrandGeneralSettings() {
  const [data, setData] = useState<BrandGeneralResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchBrandGeneralSettings();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveGeneral = useCallback(
    async (payload: UpdateBrandGeneralPayload) => {
      setSaving(true);
      setError(null);
      try {
        const response = await updateBrandGeneralSettings(payload);
        setData(response);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save settings.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const inviteMember = useCallback(
    async (payload: InviteTeamMemberPayload) => {
      setError(null);
      try {
        await inviteBrandTeamMember(payload);
        await reload();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send invitation.";
        setError(message);
        throw err;
      }
    },
    [reload],
  );

  const revokeMember = useCallback(
    async (membershipId: string) => {
      setError(null);
      try {
        await revokeBrandTeamMember(membershipId);
        await reload();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to revoke member.";
        setError(message);
        throw err;
      }
    },
    [reload],
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      setError(null);
      try {
        await cancelBrandTeamInvitation(invitationId);
        await reload();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel invitation.";
        setError(message);
        throw err;
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
    saveGeneral,
    inviteMember,
    revokeMember,
    cancelInvitation,
  };
}

export type { BrandSettingsRole };
