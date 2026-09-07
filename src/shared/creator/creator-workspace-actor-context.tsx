import { useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { fetchCreatorWorkspaceActorContext } from "../../features/settings/api/creator-team-client";
import type { CreatorShellState } from "../../layouts/app-shell/creator-shell-capabilities";
import { CreatorWorkspaceActorStateContext } from "./creator-workspace-actor-context-value";
import { toCreatorWorkspaceActorContext } from "./creator-workspace-actor-mapper";

const LOADING_STATE: CreatorShellState = {
  status: "LOADING",
  actorContext: null,
};

type ActorSnapshot = {
  actorUserId: string;
  state: CreatorShellState;
};

function recoveryState(reason: string): CreatorShellState {
  return { status: "RECOVERY", actorContext: null, reason };
}

type CreatorWorkspaceActorProviderProps = PropsWithChildren<{
  enabled: boolean;
  actorUserId?: string | null;
}>;

/**
 * The single authenticated Creator actor-context request for the persistent
 * shell and Settings. State is keyed to the signed-in User so a session switch
 * can never display the previous actor's capabilities for one render.
 */
export function CreatorWorkspaceActorProvider({
  enabled,
  actorUserId,
  children,
}: CreatorWorkspaceActorProviderProps) {
  const identity = actorUserId?.trim() ?? "";
  const [snapshot, setSnapshot] = useState<ActorSnapshot | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSnapshot(null);
      return;
    }
    if (!identity) {
      setSnapshot({
        actorUserId: identity,
        state: recoveryState(
          "The authenticated Creator identity is incomplete. Sign in again or contact support.",
        ),
      });
      return;
    }

    let active = true;
    setSnapshot({ actorUserId: identity, state: LOADING_STATE });
    const load = async () => {
      try {
        const response = await fetchCreatorWorkspaceActorContext();
        if (!active) return;
        const actorContext = toCreatorWorkspaceActorContext(response, identity);
        setSnapshot({
          actorUserId: identity,
          state: actorContext
            ? { status: "READY", actorContext }
            : recoveryState(
                "Creator workspace identity is inconsistent. Workspace actions remain unavailable until support reviews the membership.",
              ),
        });
      } catch {
        if (!active) return;
        setSnapshot({
          actorUserId: identity,
          state: recoveryState(
            "Creator workspace access could not be verified. Account security remains available while you retry later.",
          ),
        });
      }
    };
    void load();

    return () => {
      active = false;
    };
  }, [enabled, identity]);

  const state = useMemo<CreatorShellState | undefined>(() => {
    if (!enabled) return undefined;
    if (!identity) {
      return (
        snapshot?.state ??
        recoveryState(
          "The authenticated Creator identity is incomplete. Sign in again or contact support.",
        )
      );
    }
    if (!snapshot || snapshot.actorUserId !== identity) return LOADING_STATE;
    return snapshot.state;
  }, [enabled, identity, snapshot]);

  return (
    <CreatorWorkspaceActorStateContext.Provider value={state}>
      {children}
    </CreatorWorkspaceActorStateContext.Provider>
  );
}
