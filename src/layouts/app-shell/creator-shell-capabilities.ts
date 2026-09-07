import type {
  CreatorWorkspaceAction,
  CreatorWorkspaceActorContext,
} from "../../shared/creator/creator-workspace-actor.contract";

export type CreatorShellState =
  | {
      status: "LOADING";
      actorContext: null;
    }
  | {
      status: "READY";
      actorContext: CreatorWorkspaceActorContext;
    }
  | {
      status: "RECOVERY";
      actorContext: null;
      reason: string;
    };

export type CreatorShellProjectableItem = {
  alwaysAvailableInRecovery?: boolean;
  availability?: "AVAILABLE" | "UNAVAILABLE";
  requiredCreatorAction?: CreatorWorkspaceAction;
  requiresCreatorWorkspace?: boolean;
  unavailableReason?: string;
};

/**
 * Projects shell visibility from the direct Team actor context. Backend guards
 * remain authoritative; this function only keeps navigation honest.
 */
export function projectCreatorShellItems<T extends CreatorShellProjectableItem>(
  items: readonly T[],
  state?: CreatorShellState,
): T[] {
  if (!state) {
    return items.map((item) => ({ ...item, availability: "AVAILABLE" }));
  }

  if (state.status === "RECOVERY" || state.status === "LOADING") {
    const reason =
      state.status === "RECOVERY"
        ? state.reason
        : "Loading creator workspace access…";
    return items.map((item) => {
      if (item.alwaysAvailableInRecovery || !item.requiresCreatorWorkspace) {
        return { ...item, availability: "AVAILABLE" };
      }
      return {
        ...item,
        availability: "UNAVAILABLE",
        unavailableReason: reason,
      };
    });
  }

  return items
    .filter(
      (item) =>
        !item.requiredCreatorAction ||
        state.actorContext.allowedActions.includes(item.requiredCreatorAction),
    )
    .map((item) => ({ ...item, availability: "AVAILABLE" }));
}
