import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { PUBLIC_ROUTES } from "../../../features/auth/constants";
import { CampaignDetailWorkspace } from "../../../features/creator-campaigns/components/CampaignDetailWorkspace";
import { useCreatorCampaignDetail } from "../../../features/creator-campaigns/hooks/use-creator-campaign-detail";
import "../../../features/creator-campaigns/creator-campaigns.css";

export function PublicCampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite_token") ?? undefined;

  const { detail, loading, error } = useCreatorCampaignDetail(campaignId, {
    mode: "guest",
    inviteToken,
  });

  if (!campaignId) {
    return <Navigate to={PUBLIC_ROUTES.marketplace} replace />;
  }

  if (!loading && !detail && error) {
    return (
      <div className="cc-workspace">
        <p className="cc-muted">{error}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="cc-workspace">
        <p className="cc-muted">Loading campaign…</p>
      </div>
    );
  }

  return (
    <CampaignDetailWorkspace
      detail={detail}
      loading={loading}
      error={error}
      inviteToken={inviteToken}
      mode="guest"
    />
  );
}
