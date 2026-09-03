import { createContext, useContext } from "react";

import type { CreatorShellState } from "../../layouts/app-shell/creator-shell-capabilities";

export const CreatorWorkspaceActorStateContext = createContext<
  CreatorShellState | undefined
>(undefined);

export function useCreatorWorkspaceActorState(): CreatorShellState | undefined {
  return useContext(CreatorWorkspaceActorStateContext);
}
