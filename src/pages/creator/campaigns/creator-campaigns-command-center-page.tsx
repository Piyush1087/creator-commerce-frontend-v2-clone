import { CommandCenterWorkspace } from "../../../features/creator-campaigns/components/CommandCenterWorkspace";
import { useCreatorCampaignsWorkspace } from "../../../features/creator-campaigns/hooks/use-creator-campaigns-workspace";
import "../../../features/creator-campaigns/creator-campaigns.css";

export function CreatorCampaignsCommandCenterPage() {
  const { workspace, loading, error } = useCreatorCampaignsWorkspace();

  return (
    <CommandCenterWorkspace workspace={workspace} loading={loading} error={error} />
  );
}
