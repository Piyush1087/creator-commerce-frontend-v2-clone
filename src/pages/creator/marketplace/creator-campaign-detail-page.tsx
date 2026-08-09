import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { AUTH_ROUTES } from "../../../features/auth/constants";
import { CampaignDetailWorkspace } from "../../../features/creator-campaigns/components/CampaignDetailWorkspace";
import { useCreatorCampaignDetail } from "../../../features/creator-campaigns/hooks/use-creator-campaign-detail";
import "../../../features/creator-campaigns/creator-campaigns.css";

export function CreatorCampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite_token") ?? undefined;

  const { detail, loading, error, reload } = useCreatorCampaignDetail(campaignId, {
    mode: "authenticated",
    inviteToken,
  });

  if (!campaignId) {
    return <Navigate to={AUTH_ROUTES.creatorMarketplace} replace />;
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
      onApplied={() => void reload()}
    />
  );
}
