import { Link } from "react-router-dom";

import { Button } from "../../../design-system/aurora";
import { PUBLIC_ROUTES } from "../../auth/constants";
import type { MarketplaceCampaignRow } from "../contracts/creator-campaigns.contracts";
import { displayValue } from "../utils/display-value";
import { formatCompensationTeaser } from "../utils/format-campaign-display";
import { OptionalMedia } from "./OptionalMedia";

import "../creator-campaigns.css";

type CrossSellTrayProps = {
  campaigns: MarketplaceCampaignRow[];
  loading?: boolean;
  campaignBasePath?: string;
};

export function CrossSellTray({
  campaigns,
  loading = false,
  campaignBasePath = PUBLIC_ROUTES.marketplace,
}: CrossSellTrayProps) {
  if (loading) {
    return <p className="cc-muted">Loading alternative campaigns…</p>;
  }

  if (campaigns.length === 0) {
    return (
      <p className="cc-muted">
        No alternative eligible campaigns found right now. Check back after updating your profile
        or browse the marketplace.
      </p>
    );
  }

  return (
    <div className="cc-cross-sell-grid">
      {campaigns.map((campaign) => {
        const compensation = formatCompensationTeaser(campaign.compensation_teaser);
        return (
          <Link
            key={campaign.campaign_id}
            to={`${campaignBasePath}/${campaign.campaign_id}`}
            className="cc-cross-sell-card"
          >
            <OptionalMedia
              src={campaign.hero_image_url}
              className="cc-cross-sell-card__img"
              placeholderClassName="cc-media-placeholder cc-cross-sell-card__img"
            />
            <div>
              <strong>{displayValue(campaign.campaign_name)}</strong>
              <p className="cc-muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                {displayValue(campaign.brand_name)} · {compensation.value}
              </p>
              {campaign.match_score_percent !== null ? (
                <p className="cc-muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                  {displayValue(campaign.match_score_percent)}% match
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
      <Link to={campaignBasePath}>
        <Button variant="outline" fullWidthOnMobile>
          Browse full marketplace
        </Button>
      </Link>
    </div>
  );
}
