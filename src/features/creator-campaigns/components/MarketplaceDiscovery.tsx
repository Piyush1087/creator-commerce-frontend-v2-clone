import { useState } from "react";
import { ChevronRight, Filter, RotateCcw, Search, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Alert, Badge, Button } from "../../../design-system/aurora";
import { Toggle } from "../../../design-system/aurora/components/Toggle";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "../../auth/constants";
import type { MarketplaceCampaignRow } from "../contracts/creator-campaigns.contracts";
import { displayValue } from "../utils/display-value";
import {
  formatApplicationScopeLabel,
  formatCompensationTeaser,
  matchTierFromScore,
} from "../utils/format-campaign-display";
import {
  countActiveFilters,
  MarketplaceFilterDrawer,
  type MarketplaceFiltersState,
} from "./MarketplaceFilterDrawer";
import { OptionalMedia } from "./OptionalMedia";

import "../creator-campaigns.css";

type MarketplaceDiscoveryProps = {
  campaigns: MarketplaceCampaignRow[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  matchEligibleOnly: boolean;
  onMatchEligibleOnlyChange: (value: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  advancedFilters: MarketplaceFiltersState;
  onAdvancedFiltersChange: (value: MarketplaceFiltersState) => void;
  onResetFilters: () => void;
  mode?: "authenticated" | "guest";
  campaignBasePath?: string;
  brandFilter?: { slug: string; name: string | null };
  onClearBrandFilter?: () => void;
};

function MarketplaceCampaignCardItem({
  campaign,
  basePath,
  isGuest,
}: {
  campaign: MarketplaceCampaignRow;
  basePath: string;
  isGuest: boolean;
}) {
  const matchTier = matchTierFromScore(campaign.match_score_percent);
  const compensation = formatCompensationTeaser(campaign.compensation_teaser);
  const matchTone =
    matchTier === "high" ? "success" : matchTier === "medium" ? "pending" : "neutral";

  return (
    <Link to={`${basePath}/${campaign.campaign_id}`} className="cc-campaign-card">
      <div className="cc-campaign-card__media">
        <OptionalMedia
          src={campaign.hero_image_url}
          className="cc-campaign-card__media-img"
          placeholderClassName="cc-media-placeholder cc-campaign-card__media-img"
        />
        {campaign.is_invited ? (
          <div className="cc-campaign-card__match">
            <Badge tone="selected">Invited</Badge>
          </div>
        ) : campaign.match_score_percent !== null && !isGuest ? (
          <div className="cc-campaign-card__match">
            <Badge tone={matchTone}>
              {matchTier === "high"
                ? "High Match"
                : `${displayValue(campaign.match_score_percent)}% Match`}
            </Badge>
          </div>
        ) : (
          <div className="cc-campaign-card__match">
            <Badge tone="neutral">
              {formatApplicationScopeLabel(campaign.application_scope, isGuest)}
            </Badge>
          </div>
        )}
      </div>
      <div className="cc-campaign-card__body">
        <div className="cc-campaign-card__title-row">
          <h3 className="cc-campaign-card__title">{displayValue(campaign.campaign_name)}</h3>
          <Star
            size={18}
            fill={matchTier === "high" ? "var(--color-primary)" : "none"}
            color={matchTier === "high" ? "var(--color-primary)" : "var(--text-muted)"}
            aria-hidden
          />
        </div>
        <p className="cc-muted" style={{ margin: 0, fontSize: 12 }}>
          {displayValue(campaign.brand_name)} · {displayValue(campaign.industry_vertical)}
        </p>
        <p className="cc-campaign-card__hook">{displayValue(campaign.core_objective)}</p>
        <div className="cc-campaign-card__footer">
          <div>
            <div className="cc-campaign-card__payout-label">
              {isGuest ? "Compensation" : compensation.label}
            </div>
            <div className="cc-campaign-card__payout-value">
              {isGuest ? "Sign in to view" : compensation.value}
            </div>
          </div>
          <span className="cc-campaign-card__payout-value" aria-hidden>
            <ChevronRight size={20} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MarketplaceDiscovery({
  campaigns,
  totalCount,
  loading,
  error,
  matchEligibleOnly,
  onMatchEligibleOnlyChange,
  searchQuery,
  onSearchQueryChange,
  advancedFilters,
  onAdvancedFiltersChange,
  onResetFilters,
  mode = "authenticated",
  campaignBasePath,
  brandFilter,
  onClearBrandFilter,
}: MarketplaceDiscoveryProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const location = useLocation();
  const isGuest = mode === "guest";
  const basePath = campaignBasePath ?? (isGuest ? PUBLIC_ROUTES.marketplace : AUTH_ROUTES.creatorMarketplace);
  const advancedCount = countActiveFilters(advancedFilters);
  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (matchEligibleOnly ? 1 : 0) +
    (brandFilter ? 1 : 0) +
    advancedCount;

  return (
    <div className="cc-workspace">
      {isGuest ? (
        <div className="cc-guest-banner">
          <p className="cc-muted" style={{ margin: 0 }}>
            Browsing as guest. Sign in to view compensation, match scores, and apply to campaigns.
          </p>
          <Link
            to={AUTH_ROUTES.login}
            state={{ from: `${location.pathname}${location.search}` }}
            style={{ marginTop: 8, display: "inline-block" }}
          >
            <Button variant="primary" size="sm">
              Sign up / Sign in
            </Button>
          </Link>
        </div>
      ) : null}

      {brandFilter ? (
        <div className="cc-guest-banner" style={{ marginBottom: 16 }}>
          <p className="cc-muted" style={{ margin: 0 }}>
            Showing open campaigns for{" "}
            <strong>{displayValue(brandFilter.name ?? brandFilter.slug)}</strong>.
          </p>
          {onClearBrandFilter ? (
            <Button
              variant="outline"
              size="sm"
              style={{ marginTop: 8 }}
              onClick={onClearBrandFilter}
            >
              Browse all brands
            </Button>
          ) : null}
        </div>
      ) : null}

      <header style={{ marginBottom: 24 }}>
        <h1 className="cc-page-title">Creator Marketplace</h1>
        <p className="cc-muted" style={{ marginTop: 8 }}>
          {isGuest
            ? "Explore open brand campaigns. Create an account to unlock full details and apply."
            : "Discover brand campaigns matched to your profile."}
        </p>
      </header>

      {error ? (
        <div className="cc-alert-block">
          <Alert tone="error" title="Could not load marketplace">
            {error}
          </Alert>
        </div>
      ) : null}

      <section className="cc-filter-strip" aria-label="Marketplace filters">
        <div className="cc-filter-strip__toolbar">
          <label className="cc-filter-search">
            <span className="cc-sr-only">Search campaigns</span>
            <Search className="cc-filter-search__icon" size={18} aria-hidden />
            <input
              className="cc-filter-search__input"
              placeholder="Search brands, products, or hooks…"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </label>

          <div className="cc-filter-strip__controls">
            <label className="cc-filter-compact">
              <span className="cc-filter-compact__label">Niche</span>
              <input
                className="cc-filter-compact__field"
                placeholder="e.g. beauty"
                value={advancedFilters.niche}
                onChange={(e) =>
                  onAdvancedFiltersChange({ ...advancedFilters, niche: e.target.value })
                }
              />
            </label>

            <label className="cc-filter-compact cc-filter-compact--wide">
              <span className="cc-filter-compact__label">Deliverable</span>
              <select
                className="cc-filter-compact__field cc-filter-compact__select"
                value={advancedFilters.deliverable_type}
                onChange={(e) =>
                  onAdvancedFiltersChange({
                    ...advancedFilters,
                    deliverable_type: e.target.value,
                  })
                }
              >
                <option value="">Any deliverable</option>
                <option value="INSTAGRAM_REEL">Instagram Reel</option>
                <option value="INSTAGRAM_STORY">Instagram Story</option>
                <option value="TIKTOK_VIDEO">TikTok Video</option>
                <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
              </select>
            </label>

            <button
              type="button"
              className="cc-filter-more-btn"
              onClick={() => setFiltersOpen(true)}
            >
              <Filter size={16} aria-hidden />
              <span>More filters</span>
              {advancedCount > 0 ? (
                <span className="cc-filter-more-btn__count">{advancedCount}</span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="cc-filter-strip__footer">
          {!isGuest ? (
            <label className="cc-filter-strip__toggle">
              <span>Show Match Eligibility Only</span>
              <Toggle checked={matchEligibleOnly} onChange={onMatchEligibleOnlyChange} />
            </label>
          ) : (
            <span className="cc-filter-strip__guest-note">
              Match filters available after sign-in
            </span>
          )}
          <div className="cc-filter-strip__meta-row">
            <span className="cc-filter-meta">
              {activeFilterCount > 0 ? (
                <>
                  <span className="cc-filter-meta__dot" />
                  {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} applied
                </>
              ) : (
                "No filters applied"
              )}
            </span>
            <button
              type="button"
              className="cc-filter-reset-btn"
              onClick={onResetFilters}
            >
              <RotateCcw size={16} aria-hidden />
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="cc-muted">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <p className="cc-muted">No campaigns match your filters ({displayValue(totalCount)} total).</p>
      ) : (
        <div className="cc-marketplace-grid">
          {campaigns.map((campaign) => (
            <MarketplaceCampaignCardItem
              key={campaign.campaign_id}
              campaign={campaign}
              basePath={basePath}
              isGuest={isGuest}
            />
          ))}
        </div>
      )}

      <MarketplaceFilterDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={advancedFilters}
        onChange={onAdvancedFiltersChange}
        isGuest={isGuest}
      />
    </div>
  );
}
