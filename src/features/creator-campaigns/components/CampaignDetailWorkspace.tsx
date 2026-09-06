import { useEffect, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Lock,
  Radio,
  Share2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Alert, Badge, Button, Chip } from "../../../design-system/aurora";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "../../auth/constants";
import {
  claimMarketplaceInvitation,
  fetchMarketplaceAlternatives,
  fetchMarketplaceShareLink,
} from "../api/creator-campaigns-client";
import { publicBrandPath } from "../../public-brand/utils/brand-page-session";
import type {
  MarketplaceCampaignRow,
  MarketplaceDetailResponse,
} from "../contracts/creator-campaigns.contracts";
import { displayCurrency, displayValue } from "../utils/display-value";
import { formatCompensationTeaser } from "../utils/format-campaign-display";
import { CampaignApplicationWizard } from "./CampaignApplicationWizard";
import { CrossSellTray } from "./CrossSellTray";
import { OptionalMedia } from "./OptionalMedia";
import { issueCampaignApplyContinuation } from "../../creator-onboarding/api/creator-entry-client";
import { resolveSafeInternalPath } from "../../../shared/navigation/safe-internal-path";

import "../creator-campaigns.css";

type CampaignDetailWorkspaceProps = {
  detail: MarketplaceDetailResponse;
  loading?: boolean;
  error?: string | null;
  inviteToken?: string;
  mode?: "authenticated" | "guest";
  marketplacePath?: string;
  onApplied?: () => void;
};

export function CampaignDetailWorkspace({
  detail,
  loading = false,
  error = null,
  inviteToken,
  mode = "authenticated",
  marketplacePath,
  onApplied,
}: CampaignDetailWorkspaceProps) {
  const navigate = useNavigate();
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [brandLandingUrl, setBrandLandingUrl] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<MarketplaceCampaignRow[]>(
    [],
  );
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [continuationIssuing, setContinuationIssuing] = useState(false);

  const isGuest = mode === "guest" || detail.is_authenticated === false;
  const listPath =
    marketplacePath ??
    (isGuest ? PUBLIC_ROUTES.marketplace : AUTH_ROUTES.creatorMarketplace);

  const uiState = detail.ui_access_state;
  const campaign = detail.campaign;
  const compensation = formatCompensationTeaser(campaign.compensation_teaser);
  const archetypes = campaign.creator_archetypes ?? [];
  const channels = campaign.channels ?? [];
  const briefSections = detail.brief_sections ?? [];

  const canApply =
    !isGuest &&
    !detail.already_applied &&
    (uiState === "unlocked" || uiState === "invite");

  const primaryCta = isGuest
    ? (detail.registration_cta?.label ??
      "Sign up to view compensation and apply")
    : detail.already_applied
      ? "Application already submitted"
      : uiState === "invite"
        ? "Claim Exclusive Invitation"
        : uiState === "teaser"
          ? "Connect Social to Check Selection Eligibility"
          : uiState === "locked"
            ? "Application Parameters Mismatched"
            : "Submit Application to Campaign Pool";

  useEffect(() => {
    if (isGuest || uiState !== "locked") {
      setAlternatives([]);
      return;
    }
    setAlternativesLoading(true);
    void fetchMarketplaceAlternatives(campaign.campaign_id)
      .then((res) => setAlternatives(res.campaigns))
      .catch(() => setAlternatives([]))
      .finally(() => setAlternativesLoading(false));
  }, [campaign.campaign_id, isGuest, uiState]);

  const handleShare = async () => {
    if (isGuest) {
      const url = `${window.location.origin}${PUBLIC_ROUTES.marketplace}/${campaign.campaign_id}`;
      await navigator.clipboard.writeText(url);
      setShareMessage("Public link copied to clipboard.");
      return;
    }
    try {
      const res = await fetchMarketplaceShareLink(
        campaign.campaign_id,
        window.location.origin,
      );
      await navigator.clipboard.writeText(res.share_url);
      setBrandLandingUrl(res.brand_landing_url);
      setShareMessage(
        res.uses_invitation_token
          ? "Invitation link copied to clipboard."
          : "Campaign link copied to clipboard.",
      );
    } catch (err) {
      setShareMessage(
        err instanceof Error ? err.message : "Could not copy link.",
      );
    }
  };

  const handleShareBrandPage = async () => {
    const slug = campaign.brand_slug;
    if (slug) {
      const url = `${window.location.origin}${PUBLIC_ROUTES.brandLanding.replace(":slug", slug)}`;
      await navigator.clipboard.writeText(url);
      setShareMessage("Brand collaboration page link copied.");
      return;
    }
    if (brandLandingUrl) {
      await navigator.clipboard.writeText(brandLandingUrl);
      setShareMessage("Brand collaboration page link copied.");
      return;
    }
    if (!isGuest) {
      try {
        const res = await fetchMarketplaceShareLink(
          campaign.campaign_id,
          window.location.origin,
        );
        if (res.brand_landing_url) {
          await navigator.clipboard.writeText(res.brand_landing_url);
          setBrandLandingUrl(res.brand_landing_url);
          setShareMessage("Brand collaboration page link copied.");
          return;
        }
      } catch {
        /* fall through */
      }
    }
    setShareMessage("Brand page is not available for this campaign.");
  };

  const brandPagePath = campaign.brand_slug
    ? publicBrandPath(campaign.brand_slug)
    : null;

  const handlePrimaryCta = async () => {
    if (isGuest) {
      const campaignPath = `${PUBLIC_ROUTES.marketplace}/${encodeURIComponent(campaign.campaign_id)}`;
      const returnPath = resolveSafeInternalPath(
        inviteToken
          ? `${campaignPath}?invite_token=${encodeURIComponent(inviteToken)}`
          : campaignPath,
        PUBLIC_ROUTES.marketplace,
      );
      if (inviteToken) {
        navigate(AUTH_ROUTES.login, { state: { from: returnPath } });
        return;
      }
      if (continuationIssuing) return;
      setContinuationIssuing(true);
      try {
        await issueCampaignApplyContinuation(campaign.campaign_id);
        navigate("/creator/onboarding");
      } catch (issueError) {
        setShareMessage(
          issueError instanceof Error
            ? issueError.message
            : "Campaign setup could not start.",
        );
        setContinuationIssuing(false);
      }
      return;
    }
    if (uiState === "invite" && inviteToken) {
      try {
        await claimMarketplaceInvitation(inviteToken);
      } catch {
        /* claim is best-effort before wizard */
      }
    }
    if (canApply) {
      setWizardOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="cc-workspace">
        <p className="cc-muted">Loading campaign…</p>
      </div>
    );
  }

  return (
    <div className="cc-workspace">
      {error ? (
        <div className="cc-alert-block">
          <Alert tone="error" title="Could not load campaign">
            {error}
          </Alert>
        </div>
      ) : null}

      {inviteToken ? (
        <div className="cc-guest-banner">
          <p className="cc-muted" style={{ margin: 0 }}>
            Priority invitation link detected. Sign in with the invited creator
            profile to claim this campaign.
          </p>
        </div>
      ) : null}

      {isGuest ? (
        <div className="cc-guest-banner">
          <p className="cc-muted" style={{ margin: 0 }}>
            Teaser view — compensation and brief details are masked until you
            sign in.
          </p>
        </div>
      ) : null}

      <p className="cc-muted" style={{ marginBottom: 16 }}>
        <Link to={listPath}>Marketplace</Link>
        {" / "}
        {displayValue(campaign.campaign_name)}
      </p>

      <article className="cc-detail-hero">
        <div className="cc-detail-hero__top">
          <div className="cc-detail-hero__brand-logo">
            <OptionalMedia
              src={campaign.brand_logo_url}
              placeholderClassName="cc-media-placeholder cc-detail-hero__brand-logo"
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cc-detail-hero__heading">
              <div>
                <h1 className="cc-detail-hero__title">
                  {displayValue(campaign.campaign_name)}
                </h1>
                <p className="cc-muted">
                  Sponsored by{" "}
                  <strong>{displayValue(campaign.brand_name)}</strong>
                </p>
                <p className="cc-muted" style={{ marginTop: 4 }}>
                  Tagline: {displayValue(campaign.brand_tagline)}
                </p>
                {brandPagePath ? (
                  <p className="cc-muted" style={{ marginTop: 4 }}>
                    <Link to={brandPagePath}>
                      Visit brand collaboration page
                    </Link>
                  </p>
                ) : null}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Badge tone="selected">
                  {displayValue(campaign.core_objective)}
                </Badge>
                {detail.is_invited ? (
                  <Badge tone="pending">Invited</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="cc-detail-telemetry">
          <div className="cc-detail-telemetry__item">
            <div className="cc-detail-telemetry__icon">
              <Calendar size={20} aria-hidden />
            </div>
            <div>
              <p className="cc-detail-telemetry__label">Execution Window</p>
              <p className="cc-detail-telemetry__value">
                {displayValue(campaign.execution_window)}
              </p>
            </div>
          </div>
          <div className="cc-detail-telemetry__item">
            <div className="cc-detail-telemetry__icon">
              <Radio size={20} aria-hidden />
            </div>
            <div>
              <p className="cc-detail-telemetry__label">Required Channels</p>
              <p className="cc-detail-telemetry__value">
                {channels.length > 0 ? displayValue(channels) : "-"}
              </p>
            </div>
          </div>
          <div className="cc-detail-telemetry__item">
            <div>
              <p className="cc-detail-telemetry__label">Match score</p>
              <p className="cc-detail-telemetry__value">
                {detail.match_score_percent !== null
                  ? `${displayValue(detail.match_score_percent)}%`
                  : "-"}
              </p>
            </div>
          </div>
          <div className="cc-detail-telemetry__item">
            <div>
              <p className="cc-detail-telemetry__label">Application scope</p>
              <p className="cc-detail-telemetry__value">
                {displayValue(detail.application_scope)}
              </p>
            </div>
          </div>
        </div>
      </article>

      <div className="cc-detail-layout">
        <section className="cc-detail-panel">
          <h3>Product & incentive</h3>
          <div className="cc-detail-product-row">
            <OptionalMedia
              src={campaign.product_image_url}
              className="cc-detail-product-thumb"
              placeholderClassName="cc-media-placeholder cc-detail-product-thumb"
            />
            <div>
              <p className="cc-detail-product-name">
                {displayValue(campaign.product_name)}
              </p>
              <p className="cc-muted">
                Retail value:{" "}
                {isGuest
                  ? "Sign in to view"
                  : displayCurrency(campaign.product_retail_value)}
              </p>
              <p className="cc-muted" style={{ marginTop: 8 }}>
                {isGuest
                  ? "Compensation: Sign in to view"
                  : `${compensation.label}: ${compensation.value}`}
              </p>
            </div>
          </div>
          <div className="cc-chip-row">
            {archetypes.length > 0 ? (
              archetypes.map((tag) => (
                <Chip key={tag} tone="neutral">
                  {displayValue(tag)}
                </Chip>
              ))
            ) : (
              <Chip tone="neutral">-</Chip>
            )}
          </div>
        </section>

        <section className="cc-detail-panel">
          <h3>Creative brief</h3>
          {uiState === "locked" && !isGuest ? (
            <div className="cc-locked-alert cc-locked-alert--critical">
              <h4>Application Parameters Mismatched</h4>
              <p>
                Your synced audience profile does not meet this campaign&apos;s
                target criteria.
              </p>
            </div>
          ) : null}

          {uiState === "teaser" || isGuest ? (
            <div className="cc-gated-wrap">
              <div className="cc-gated-blur" aria-hidden>
                <p>
                  Brief and compliance parameters are masked in teaser mode.
                </p>
              </div>
              <div className="cc-gated-overlay">
                <div className="cc-gated-overlay__lock">
                  <Lock size={22} aria-hidden />
                </div>
                <p className="cc-muted" style={{ maxWidth: 320 }}>
                  {isGuest
                    ? "Sign in to unlock creative guidelines and apply."
                    : "Connect your social account to unlock brief details."}
                </p>
                <Button
                  variant="primary"
                  onClick={() => void handlePrimaryCta()}
                >
                  {isGuest ? "Sign in" : "Connect Social to Unlock"}
                </Button>
              </div>
            </div>
          ) : uiState === "unlocked" || uiState === "invite" ? (
            <div className="cc-brief-accordion">
              {briefSections.length > 0 ? (
                briefSections.map((section) => {
                  const open = openSectionId === section.brief_id;
                  return (
                    <div
                      key={section.brief_id}
                      className="cc-brief-accordion__item"
                    >
                      <button
                        type="button"
                        className="cc-brief-accordion__trigger"
                        onClick={() =>
                          setOpenSectionId(open ? null : section.brief_id)
                        }
                      >
                        {displayValue(section.title)}
                        {open ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                      {open ? (
                        <div className="cc-brief-accordion__body">
                          {displayValue(section.body)}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="cc-muted">-</p>
              )}
            </div>
          ) : (
            <div className="cc-gated-wrap">
              <div className="cc-gated-blur" aria-hidden>
                <p>Brief content remains masked for ineligible profiles.</p>
              </div>
              <div className="cc-gated-overlay">
                <div className="cc-gated-overlay__lock">
                  <Lock size={22} aria-hidden />
                </div>
              </div>
            </div>
          )}

          <div className="cc-detail-cta-row">
            <Button
              variant={
                canApply || isGuest || uiState === "invite"
                  ? "primary"
                  : "disabled"
              }
              fullWidthOnMobile
              onClick={() => void handlePrimaryCta()}
              disabled={continuationIssuing}
            >
              {continuationIssuing ? "Starting secure setup…" : primaryCta}
            </Button>
            <Button
              variant="outline"
              fullWidthOnMobile
              onClick={() => void handleShare()}
            >
              <Share2 size={16} style={{ marginRight: 8 }} aria-hidden />
              Share campaign link
            </Button>
            <Button
              variant="outline"
              fullWidthOnMobile
              onClick={() => void handleShareBrandPage()}
            >
              Share brand page
            </Button>
          </div>
          {shareMessage ? (
            <p className="cc-muted" style={{ marginTop: 8 }}>
              {shareMessage}
            </p>
          ) : null}
        </section>
      </div>

      {uiState === "locked" && !isGuest ? (
        <section className="cc-detail-panel" style={{ marginTop: 16 }}>
          <h3>Alternative campaigns for you</h3>
          <CrossSellTray
            campaigns={alternatives}
            loading={alternativesLoading}
            campaignBasePath={AUTH_ROUTES.creatorMarketplace}
          />
        </section>
      ) : null}

      {wizardOpen ? (
        <CampaignApplicationWizard
          detail={detail}
          onClose={() => setWizardOpen(false)}
          onSubmitted={() => {
            setWizardOpen(false);
            onApplied?.();
          }}
        />
      ) : null}
    </div>
  );
}
