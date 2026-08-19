import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import {
  canCreateCanonicalBrief,
  canEditCanonicalBrief,
  canLinkCanonicalAsset,
} from "./campaign-page-model";
import type {
  CampaignPageView,
  CanonicalCampaignAsset,
  CanonicalCampaignBriefSummary,
} from "./types";

export function CampaignAssetsBriefsPanel({
  view,
  onLinkAsset,
  onCreateBrief,
  onEditBrief,
  onOpenLegacyProduct,
  onOpenLegacyBrief,
}: {
  view: CampaignPageView;
  onLinkAsset: () => void;
  onCreateBrief: (asset: CanonicalCampaignAsset) => void;
  onEditBrief: (
    asset: CanonicalCampaignAsset,
    brief: CanonicalCampaignBriefSummary,
  ) => void;
  onOpenLegacyProduct?: (campaignAssetId: string) => void | Promise<void>;
  onOpenLegacyBrief?: (
    briefId: string,
    campaignAssetId: string,
  ) => void | Promise<void>;
}) {
  const canLink = canLinkCanonicalAsset(view);
  const canCreateBrief = canCreateCanonicalBrief(view);
  const canEditBrief = canEditCanonicalBrief(view);
  const legacyBriefCount = view.productsBriefsSummary.products.reduce(
    (count, product) => count + product.briefs.length,
    0,
  );

  const assetKindLabel = (asset: CanonicalCampaignAsset) =>
    asset.kind === "OFFERING" && asset.subtype ? asset.subtype : asset.kind;

  return (
    <>
      <Card
        action={
          canLink ? (
            <Button onClick={onLinkAsset}>Link Campaign Asset</Button>
          ) : null
        }
        className="canonical-campaign-page__setup"
        compact
        eyebrow="Canonical setup"
        title="Campaign Asset → Brief"
      >
        <div className="canonical-campaign-page__stack">
          {view.assetsBriefsSummary.assets.length === 0 ? (
            <p className="canonical-campaign-page__empty">
              No canonical Campaign Assets are linked. Legacy Products are not
              inferred as canonical Assets.
            </p>
          ) : (
            view.assetsBriefsSummary.assets.map((asset) => (
              <article
                className="canonical-campaign-page__asset"
                key={asset.campaignAssetId}
              >
                <div className="canonical-campaign-page__asset-header">
                  <div className="canonical-campaign-page__asset-title">
                    {asset.imageUrl ? (
                      <img
                        alt=""
                        className="canonical-campaign-page__asset-image"
                        src={asset.imageUrl}
                      />
                    ) : null}
                    <div>
                      <strong>{asset.name}</strong>
                      <div className="canonical-campaign-page__asset-badges">
                        <Badge tone="neutral">{assetKindLabel(asset)}</Badge>
                        <Badge tone="neutral">{asset.status}</Badge>
                      </div>
                    </div>
                  </div>
                  {canCreateBrief && asset.status === "ACTIVE" ? (
                    <Button
                      onClick={() => onCreateBrief(asset)}
                      size="sm"
                      variant="outline"
                    >
                      Create Brief
                    </Button>
                  ) : null}
                </div>

                <div className="canonical-campaign-page__brief-list">
                  {asset.briefs.length === 0 ? (
                    <p className="canonical-campaign-page__empty">
                      No canonical Briefs beneath this Asset.
                    </p>
                  ) : (
                    asset.briefs.map((brief) => (
                      <article
                        className="canonical-campaign-page__canonical-brief"
                        key={brief.briefId}
                      >
                        <div className="canonical-campaign-page__brief-row">
                          <div className="canonical-campaign-page__asset-title">
                            <strong>{brief.name}</strong>
                            <Badge tone="neutral">{brief.status}</Badge>
                          </div>
                          {canEditBrief ? (
                            <Button
                              onClick={() => onEditBrief(asset, brief)}
                              size="sm"
                              variant="ghost"
                            >
                              Edit Brief
                            </Button>
                          ) : null}
                        </div>
                        <p>{brief.creativeRequirements}</p>
                        <div className="canonical-campaign-page__deliverables">
                          {brief.deliverables.map((deliverable) => (
                            <div key={deliverable.deliverableId}>
                              <span>{deliverable.format}</span>
                              <strong>Quantity {deliverable.quantity}</strong>
                              <p>{deliverable.creativeRequirements}</p>
                              <small>
                                {deliverable.publishingRequired
                                  ? "Publishing required"
                                  : "Publishing not required"}
                              </small>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </Card>

      <Card
        className="canonical-campaign-page__legacy"
        compact
        title={view.productsBriefsSummary.label ?? "Legacy Products & Briefs"}
      >
        <div className="canonical-campaign-page__legacy-summary">
          <Alert title="Legacy compatibility data" tone="warning">
            These Products, Briefs, and their IDs remain legacy compatibility
            records. They do not satisfy canonical Asset or Brief readiness.
          </Alert>
          {view.productsBriefsSummary.products.length === 0 ? (
            <p className="canonical-campaign-page__empty">
              No legacy compatibility data.
            </p>
          ) : (
            <details className="canonical-campaign-page__legacy-disclosure">
              <summary>
                Show {view.productsBriefsSummary.products.length} legacy Product
                {view.productsBriefsSummary.products.length === 1
                  ? ""
                  : "s"} · {legacyBriefCount} legacy Brief
                {legacyBriefCount === 1 ? "" : "s"}
              </summary>
              <div className="canonical-campaign-page__stack">
                {view.productsBriefsSummary.products.map((product) => (
                  <article
                    className="canonical-campaign-page__asset"
                    key={product.campaignAssetId}
                  >
                    <div className="canonical-campaign-page__asset-header">
                      <div className="canonical-campaign-page__asset-title">
                        <strong>{product.name}</strong>
                        <Badge tone="neutral">Legacy Product</Badge>
                      </div>
                      <Button
                        onClick={() =>
                          void onOpenLegacyProduct?.(product.campaignAssetId)
                        }
                        size="sm"
                        variant="ghost"
                      >
                        View legacy product
                      </Button>
                    </div>
                    <div className="canonical-campaign-page__brief-list">
                      {product.briefs.map((brief) => (
                        <div
                          className="canonical-campaign-page__brief-row"
                          key={brief.briefId}
                        >
                          <div className="canonical-campaign-page__asset-title">
                            <span>{brief.name}</span>
                            <Badge tone="neutral">Legacy Brief</Badge>
                          </div>
                          <Button
                            onClick={() =>
                              void onOpenLegacyBrief?.(
                                brief.briefId,
                                product.campaignAssetId,
                              )
                            }
                            size="sm"
                            variant="ghost"
                          >
                            View legacy brief
                          </Button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          )}
        </div>
      </Card>
    </>
  );
}
