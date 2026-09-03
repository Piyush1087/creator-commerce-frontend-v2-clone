import { CreatorSettingsShell } from "../../../features/settings/components/creator-settings-shell";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";

export function CreatorSettingsLayout() {
  const shellState = useCreatorWorkspaceActorState();
  return <CreatorSettingsShell shellState={shellState} />;
}
