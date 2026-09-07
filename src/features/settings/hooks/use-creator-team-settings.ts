import { useCallback, useEffect, useState } from "react";

import {
  cancelCreatorTeamInvitation,
  fetchCreatorTeam,
  inviteCreatorTeamMember,
  removeCreatorTeamMember,
  updateCreatorTeamMemberRole,
} from "../api/creator-team-client";
import type {
  CreatorTeamAssignableRole,
  CreatorTeamResponse,
  InviteCreatorTeamMemberPayload,
} from "../contracts/creator-team.contracts";

export function useCreatorTeamSettings() {
  const [data, setData] = useState<CreatorTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchCreatorTeam());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Creator Team is unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const run = useCallback(
    async (operation: () => Promise<unknown>) => {
      setError(null);
      try {
        await operation();
        await reload();
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Creator Team action failed.";
        setError(message);
        throw cause;
      }
    },
    [reload],
  );

  return {
    data,
    loading,
    error,
    reload,
    invite: (payload: InviteCreatorTeamMemberPayload) =>
      run(() => inviteCreatorTeamMember(payload)),
    changeRole: (membershipId: string, role: CreatorTeamAssignableRole) =>
      run(() => updateCreatorTeamMemberRole(membershipId, role)),
    remove: (membershipId: string) =>
      run(() => removeCreatorTeamMember(membershipId)),
    cancelInvitation: (invitationId: string) =>
      run(() => cancelCreatorTeamInvitation(invitationId)),
  };
}
