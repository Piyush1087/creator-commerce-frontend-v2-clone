import { useCallback, useEffect, useState } from "react";

import {
  cancelCreatorTeamInvitation,
  fetchCreatorProfileSettings,
  fetchCreatorShipping,
  fetchCreatorWorkspace,
  inviteCreatorTeamMember,
  revokeCreatorTeamMember,
  updateCreatorProfileSettings,
  updateCreatorWorkspace,
  upsertCreatorShipping,
} from "../api/creator-settings-client";
import type {
  CreatorProfileResponse,
  CreatorShippingResponse,
  CreatorTeamRole,
  CreatorWorkspaceResponse,
  InviteWorkspaceMemberPayload,
  UpdateCreatorProfilePayload,
  UpsertCreatorShippingPayload,
} from "../contracts/creator-settings.contracts";

export function useCreatorProfileSettings() {
  const [profile, setProfile] = useState<CreatorProfileResponse | null>(null);
  const [shipping, setShipping] = useState<CreatorShippingResponse | null>(null);
  const [workspace, setWorkspace] = useState<CreatorWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, shippingResponse, workspaceResponse] = await Promise.all([
        fetchCreatorProfileSettings(),
        fetchCreatorShipping(),
        fetchCreatorWorkspace(),
      ]);
      setProfile(profileResponse);
      setShipping(shippingResponse);
      setWorkspace(workspaceResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load creator settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveAll = useCallback(
    async (payload: {
      profile?: UpdateCreatorProfilePayload;
      workspaceName?: string;
      shipping?: UpsertCreatorShippingPayload;
    }) => {
      setSaving(true);
      setError(null);
      try {
        if (payload.profile && Object.keys(payload.profile).length > 0) {
          const nextProfile = await updateCreatorProfileSettings(payload.profile);
          setProfile(nextProfile);
        }
        if (payload.workspaceName !== undefined) {
          const nextWorkspace = await updateCreatorWorkspace({
            organizationDisplayName: payload.workspaceName,
          });
          setWorkspace(nextWorkspace);
        }
        if (payload.shipping) {
          const nextShipping = await upsertCreatorShipping(payload.shipping);
          setShipping(nextShipping);
        }
        await reload();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save settings.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const inviteMember = useCallback(
    async (payload: InviteWorkspaceMemberPayload) => {
      setError(null);
      try {
        await inviteCreatorTeamMember(payload);
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
    async (memberId: string) => {
      setError(null);
      try {
        await revokeCreatorTeamMember(memberId);
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
        await cancelCreatorTeamInvitation(invitationId);
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
    profile,
    shipping,
    workspace,
    loading,
    saving,
    error,
    reload,
    saveAll,
    inviteMember,
    revokeMember,
    cancelInvitation,
  };
}

export type { CreatorTeamRole };
