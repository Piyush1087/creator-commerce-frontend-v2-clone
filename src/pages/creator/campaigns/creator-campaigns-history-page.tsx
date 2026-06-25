import { HistoryArchiveWorkspace } from "../../../features/creator-campaigns/components/HistoryArchiveWorkspace";
import { useCreatorCampaignsHistory } from "../../../features/creator-campaigns/hooks/use-creator-campaigns-workspace";
import "../../../features/creator-campaigns/creator-campaigns.css";

export function CreatorCampaignsHistoryPage() {
  const { history, loading, error } = useCreatorCampaignsHistory();

  return (
    <HistoryArchiveWorkspace history={history} loading={loading} error={error} />
  );
}
